import test from 'node:test';
import assert from 'node:assert/strict';
import { planIntake, uploadAll, intakeMessage, sendableIds } from './attachmentIntake.mjs';

const f = (name, size = 100) => ({ name, size });

test('plan keeps supported files and says why others were skipped', () => {
  const { take, skipped } = planIntake([f('a.csv'), f('b.exe'), f('c.pdf', 0), f('d.xlsx', 20 * 1048576), f('a.csv')]);
  assert.deepEqual(take.map((x) => x.name), ['a.csv']);
  assert.equal(skipped.length, 4);
  assert.match(skipped[0].reason, /not a supported type/);
  assert.match(skipped[1].reason, /empty/);
  assert.match(skipped[2].reason, /larger than 15 MB/);
  assert.match(skipped[3].reason, /already attached/);
});

test('plan takes images, which the server reads with OCR', () => {
  const { take, skipped } = planIntake([f('chart.png'), f('Invoice.JPG'), f('scan.tiff')]);
  assert.deepEqual(take.map((x) => x.name), ['chart.png', 'Invoice.JPG', 'scan.tiff']);
  assert.equal(skipped.length, 0);
});

test('plan respects the room left on the message and files already attached', () => {
  const have = [{ filename: 'x.csv', size_bytes: 100 }, ...Array.from({ length: 7 }, (_, i) => ({ filename: `h${i}.csv`, size_bytes: i }))];
  const { take, skipped } = planIntake([f('x.csv'), f('n1.csv'), f('n2.csv'), f('n3.csv')], have);
  assert.deepEqual(take.map((x) => x.name), ['n1.csv', 'n2.csv']);
  assert.match(skipped.find((s) => s.name === 'n3.csv').reason, /at most 10/);
  assert.match(skipped.find((s) => s.name === 'x.csv').reason, /already attached/);
});

test('one failed upload keeps the others, in order, with progress', async () => {
  const seen = [];
  const res = await uploadAll([f('a.csv'), f('b.csv'), f('c.csv'), f('d.csv')], async (file) => {
    if (file.name === 'b.csv') throw new Error('Server said no');
    return { attachment_id: file.name, filename: file.name, status: 'parsed' };
  }, { concurrency: 2, onProgress: (d, n) => seen.push([d, n]) });
  assert.deepEqual(res.map((r) => r.attachment?.attachment_id ?? 'ERR'), ['a.csv', 'ERR', 'c.csv', 'd.csv']);
  assert.deepEqual(seen.at(-1), [4, 4]);
  assert.match(intakeMessage([], res), /b\.csv: Server said no/);
});

test('message names every problem and failed files are not sent', () => {
  const att = { attachment_id: 'z', filename: 'z.pdf', status: 'failed', notes: ['No text found'] };
  const msg = intakeMessage([{ name: 'q.exe', reason: 'is not a supported type' }], [{ file: f('z.pdf'), attachment: att }]);
  assert.match(msg, /q\.exe is not a supported type\./);
  assert.match(msg, /z\.pdf: No text found/);
  assert.equal(intakeMessage([], [{ file: f('a.csv'), attachment: { status: 'parsed', filename: 'a.csv' } }]), '');
  assert.deepEqual(sendableIds([att, { attachment_id: 'ok', status: 'parsed' }]), ['ok']);
});
