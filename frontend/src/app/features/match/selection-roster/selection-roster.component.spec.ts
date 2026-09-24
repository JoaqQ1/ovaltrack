import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionRosterComponent } from './selection-roster.component';

describe('SelectionRosterComponent', () => {
  let component: SelectionRosterComponent;
  let fixture: ComponentFixture<SelectionRosterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionRosterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionRosterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
