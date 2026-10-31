import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { globeWidgetSpec } from './globeWidget.mjs';

describe('globe view as a dashboard widget', () => {
  it('keeps the live layers, the view and the area', () => {
    const w = globeWidgetSpec({
      id: 'w1',
      layers: ['earthquakes', 'weather', 'flights', 'flights'],
      view: { lat: 19.07612, lng: 72.87765, zoom: 4.567 },
      outline: [[68, 24.5], [74.5, 24.5], [74.5, 20]],
      title: '  West India  ',
    });
    assert.equal(w.component, 'globe_view');
    assert.deepEqual(w.props.layers, ['earthquakes', 'flights']);      // weather is a web-only colour field
    assert.deepEqual(w.props.center, { lat: 19.076, lon: 72.878, zoom: 4.57 });
    assert.equal(w.props.outline.length, 3);
    assert.equal(w.title, 'West India');
  });

  it('refuses a view with nothing it can draw, and names itself', () => {
    assert.throws(() => globeWidgetSpec({ id: 'w2', layers: ['weather', 'radar'] }), /Turn on a live layer/);
    assert.equal(globeWidgetSpec({ id: 'w3', layers: ['news_events'] }).title, 'Live globe: News events');
  });
});
