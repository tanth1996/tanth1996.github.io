import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroAnimation } from './intro-animation';

describe('IntroAnimation', () => {
  let component: IntroAnimation;
  let fixture: ComponentFixture<IntroAnimation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroAnimation],
    }).compileComponents();

    fixture = TestBed.createComponent(IntroAnimation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
