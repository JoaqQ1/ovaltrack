import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  it('parte del estado actual del navegador', () => {
    expect(TestBed.inject(ConnectivityService).online()).toBe(navigator.onLine);
  });

  it('refleja los eventos online y offline', () => {
    const service = TestBed.inject(ConnectivityService);

    window.dispatchEvent(new Event('offline'));
    expect(service.online()).toBeFalse();

    window.dispatchEvent(new Event('online'));
    expect(service.online()).toBeTrue();
  });
});
