import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbAnimation } from './db-animation';

describe('DbAnimation', () => {
  let component: DbAnimation;
  let fixture: ComponentFixture<DbAnimation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbAnimation],
    }).compileComponents();

    fixture = TestBed.createComponent(DbAnimation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
