import { TemplateRef } from '@angular/core';
import { SdsDrawerCommunicationService } from './drawer-communication.service';

describe('SdsDrawerCommunicationService', () => {
  it('publishes initial state and subsequent drawer transitions with their templates', () => {
    const service = new SdsDrawerCommunicationService();
    const states: boolean[] = [];
    const templates: (TemplateRef<unknown> | null)[] = [];
    const stateSubscription = service.isDrawerOpen.subscribe((value) => states.push(value));
    const templateSubscription = service.contentTemplate.subscribe((value) => templates.push(value));
    const template = {} as TemplateRef<unknown>;

    try {
      expect(states).toEqual([false]);
      expect(templates).toEqual([null]);
      service.onDrawerOpen(true, template);
      service.onDrawerOpen(false, null);
      expect(states).toEqual([false, true, false]);
      expect(templates).toEqual([null, template, null]);
    } finally {
      stateSubscription.unsubscribe();
      templateSubscription.unsubscribe();
    }
  });
});
