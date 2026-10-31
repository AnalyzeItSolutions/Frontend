// Pure helpers for the "Do it for me" live view. No React, so they unit-test with `node --test`.

const FINAL = ['done', 'failed', 'stopped', 'expired'];

export function isTaskFinal(status) {
  return FINAL.includes(status);
}

/** One line under the goal describing where the task is. */
export function taskStatusText(task) {
  if (!task) return '';
  switch (task.status) {
    case 'running': return `Working… ${task.step_count} step${task.step_count === 1 ? '' : 's'} so far.`;
    case 'needs_you': return task.waiting?.kind === 'ask' ? 'Waiting for you to approve a step.' : 'Waiting for you to sign in.';
    case 'done': return task.message || 'Done.';
    case 'failed': return task.message || 'The task did not finish.';
    case 'stopped': return 'Stopped. Nothing further was done.';
    case 'expired': return task.message || 'The task ran out of time.';
    default: return task.status || '';
  }
}

/** What the live-view controls should show right now. */
export function taskControls(task) {
  if (!task) return { stop: false, continue: false, approve: false, deny: false };
  if (isTaskFinal(task.status)) return { stop: false, continue: false, approve: false, deny: false };
  if (task.status === 'needs_you' && task.waiting?.kind === 'ask') {
    return { stop: true, continue: false, approve: true, deny: true };
  }
  if (task.status === 'needs_you') {
    // A sign-in pause: the person signs in in the live view, then Continue. No approve/deny.
    return { stop: true, continue: true, approve: false, deny: false };
  }
  return { stop: true, continue: false, approve: false, deny: false };    // running
}

/** Poll faster while running, slower while waiting on the person; never poll a finished task. */
export function pollDelayMs(status) {
  if (isTaskFinal(status)) return 0;
  return status === 'needs_you' ? 2500 : 1200;
}

/** A short, human label for a step in the trace. */
export function stepLabel(step) {
  const a = step?.action || '';
  const d = step?.detail || {};
  if (a === 'navigate') return `Open ${d.url || 'a page'}`;
  if (a === 'click') return `Click ${d.target || 'a control'}`;
  if (a === 'type') return `Type into ${d.target || 'a field'}`;
  if (a === 'press') return `Press ${d.key || 'a key'}`;
  if (a === 'scroll') return `Scroll ${d.direction || 'down'}`;
  if (a === 'read') return 'Read the page';
  if (a === 'wait') return 'Wait';
  return a || 'Step';
}
