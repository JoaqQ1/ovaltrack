import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { MatchSelectComponent } from './match-selection.component';

describe('MatchSelectionComponent', () => {
  let component: MatchSelectionComponent;
  let fixture: ComponentFixture<MatchSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
          imports: [MatchSelectComponent],
          providers: [
            { provide: Router, useValue: { navigate: () => Promise.resolve(true) } }
          ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
