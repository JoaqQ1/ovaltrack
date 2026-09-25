import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostMatchComponent } from './post-match.component';

describe('PostMatchComponent', () => {
  let component: PostMatchComponent;
  let fixture: ComponentFixture<PostMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
