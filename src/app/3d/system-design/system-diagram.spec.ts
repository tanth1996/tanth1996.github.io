import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemDiagramComponent } from './system-diagram';

describe('SystemDiagramComponent', () => {
  let component: SystemDiagramComponent;
  let fixture: ComponentFixture<SystemDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemDiagramComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
