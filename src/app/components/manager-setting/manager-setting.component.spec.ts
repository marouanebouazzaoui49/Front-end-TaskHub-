import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerSettingComponent } from './manager-setting.component';

describe('ManagerSettingComponent', () => {
  let component: ManagerSettingComponent;
  let fixture: ComponentFixture<ManagerSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManagerSettingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
