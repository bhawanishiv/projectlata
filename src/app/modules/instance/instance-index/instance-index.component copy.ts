import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommandService } from 'src/app/services/command.service';
import { InstanceService } from 'src/app/services/instance.service';
import { Instance } from 'src/app/models/instance.model';
import { Subscription, Observable } from 'rxjs';
import { ActivityService } from 'src/app/services/activity.service';
import { Activity } from 'src/app/models/activity.model';
import { PinConfigurationService } from 'src/app/services/pin-configuration.service';
import { Pin } from 'src/app/models/cpu.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-instance-index',
  templateUrl: './instance-index.component.html',
  styleUrls: ['./instance-index.component.scss']
})
export class InstanceIndexComponent implements OnInit {

  statusString = { unavailable: 'unavailable', running: 'running', stopped: 'stopped' };

  filteredPinConfigurations: Pin[];
  instance: Instance;
  cmdResponses: any;
  instanceSubscription: Subscription;
  cmdSubscription: Subscription;
  pinsSubscription: Subscription;

  activity$: Observable<Activity>;
  constructor(
    private router: Router,
    private pinService: PinConfigurationService,
    private cmdService: CommandService,
    private activityService: ActivityService,
    private instanceService: InstanceService) { }

  ngOnInit(): void {
    this.instanceSubscription = this.instanceService.currentInstance$.subscribe(instance => {
      if (!instance) return;
      this.instance = instance;
      this.activity$ = this.activityService.get(instance.activityId);
      this.cmdSubscription = this.cmdService.get(this.instance.instanceId).subscribe(cmdResponses => this.cmdResponses = cmdResponses);
      this.pinsSubscription = this.pinService.getAll(instance.instanceId).subscribe(pinDefinitions => this.filteredPinConfigurations = pinDefinitions.filter(pin => pin.pinMode == 'output'))
    });
  }
  ngOnDestroy() {
    if (!this.instanceSubscription) return;
    this.instanceSubscription.unsubscribe();
    if (!this.cmdResponses) return;
    this.cmdSubscription.unsubscribe();
    if (!this.pinsSubscription) return;
    this.pinsSubscription.unsubscribe();
  }

  getStatus(pinNo: string) {
    if (!this.cmdResponses) return null;
    return this.cmdResponses[pinNo]

  }
  getPinValue(pinNo: string) {
    if (!this.getStatus(pinNo)) return -1;
    return this.getStatus(pinNo)['val'];
  }

  toggleStatus(pinNo: string) {
    let newVal = this.getPinValue(pinNo) == 1 ? 0 : 1;
    this.cmdService.send(this.instance.instanceId, { [pinNo]: { val: newVal, mode: 'client' } })
  }
  getStatusText(pinNo: string) {
    let val = this.getPinValue(pinNo);
    if (val == 0) return this.statusString.stopped;
    else if (val == 1) return this.statusString.running;
    else return this.statusString.unavailable;
  }

  navToAddPinDefinition() {
    this.router.navigate(['i', this.instance.instanceId, 'settings', 'configure']);
  }
}
