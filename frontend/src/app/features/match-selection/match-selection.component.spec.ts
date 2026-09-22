import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { MatchSelectComponent } from './match-selection.component';
import { MatchService } from '../cargaEnVivo/services/live-capture.service';

describe('MatchSelectionComponent', () => {
  let component: MatchSelectComponent;
  let fixture: ComponentFixture<MatchSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchSelectComponent],
      providers: [
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: MatchService,
          useValue: {
            getMatches: () => of([]),
            createMatch: () => of({}),
            deleteMatch: () => of(undefined),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
