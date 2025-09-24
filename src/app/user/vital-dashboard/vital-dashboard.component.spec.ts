import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalDashboardComponent } from './vital-dashboard.component';

describe('VitalDashboardComponent', () => {
  let component: VitalDashboardComponent;
  let fixture: ComponentFixture<VitalDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VitalDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
