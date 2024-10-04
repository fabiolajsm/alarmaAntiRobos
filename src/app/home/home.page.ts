import { Component, OnDestroy, OnInit } from '@angular/core';
import { arrowRedoOutline } from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { AuthService } from '../services/auth.service';
import { PluginListenerHandle } from '@capacitor/core';
import { CapacitorFlash } from '@capgo/capacitor-flash';
import { Motion, MotionEventResult } from '@capacitor/motion';
import { Haptics } from '@capacitor/haptics';
import { UserInterface } from '../interfaces/user.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    NgxSpinnerModule,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private currentUser: UserInterface | undefined;

  private accelHandler: PluginListenerHandle | null = null;
  public audio: HTMLAudioElement = new Audio();
  private currentAction: string | null = null;
  public isDetectorActive = false;
  private lastTriggerCall: string = '';
  private timerId: any;

  constructor(public auth: AuthService, public spinner: NgxSpinnerService) {
    addIcons({ arrowRedoOutline });
  }

  handleLogout() {
    this.stopListening();
    this.auth.logout();
  }

  ngOnInit(): void {
    this.auth.getCurrentUser().subscribe((user) => {
      this.currentUser = user;
    });
  }

  play(direction: string) {
    this.audio.pause();
    this.audio = new Audio(`assets/audios/${direction}.mp3`);
    this.audio.volume = 1;
    this.audio.play().catch((error) => {
      console.error('Error al reproducir el audio:', error);
    });
  }

  async toggleDetector() {
    if (this.isDetectorActive) {
      const { value: password } = await Swal.fire({
        title: 'Ingrese su contraseña para desactivar la alarma',
        input: 'password',
        inputPlaceholder: 'contraseña',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        heightAuto: false,
        customClass: {
          title: 'custom-alert-title',
          confirmButton: 'custom-alert-confirm-btn ',
        },
        inputValidator: (value) => {
          if (!value) {
            return 'Necesita ingresar una contraseña!';
          }
          return '';
        },
      });

      // Solo se ejecuta si el usuario ingresó una contraseña
      if (password) {
        if (password === this.currentUser?.clave.toString()) {
          this.deactivateDetector();
        } else {
          this.triggerAlarm();
          Swal.fire({
            heightAuto: false,
            icon: 'error',
            title: 'Contraseña incorrecta',
            text: 'La contraseña ingresada no es correcta. ¿¿¿¿ESTÁS INTENTANDO ROBAR????',
            customClass: {
              title: 'custom-alert-title',
              confirmButton: 'custom-alert-confirm-btn ',
            },
          });
        }
      }
    } else {
      this.activateDetector();
    }
  }

  activateDetector() {
    this.isDetectorActive = true;
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any)
          .requestPermission()
          .then((permission: any) => {
            if (permission === 'granted') {
              this.startListening();
            } else {
              console.error('Permission not granted');
            }
          });
      } else {
        this.startListening();
      }
    } catch (e) {
      console.error('Permission denied or error occurred:', e);
    }
  }

  startListening() {
    Motion.addListener('accel', (event: MotionEventResult) => {
      this.handleMotion(event);
    }).then((handler) => {
      this.accelHandler = handler;
    });
  }

  deactivateDetector() {
    this.isDetectorActive = false;
    this.lastTriggerCall == '';
    this.stopListening();
  }

  handleMotion(event: MotionEventResult) {
    const { x, y, z } = event.accelerationIncludingGravity;

    if (Math.abs(y) > Math.abs(x)) {
      if (y > 5 && this.currentAction !== 'vertical') {
        this.currentAction = 'vertical';
        this.triggerVerticalAction();
      }
    } else if (Math.abs(z) > 5 && this.currentAction !== 'horizontal') {
      this.currentAction = 'horizontal';
      this.triggerHorizontalAction();
    } else {
      if (x > 5 && this.currentAction !== 'right') {
        this.currentAction = 'right';
        this.triggerRightAction();
      } else if (x < -5 && this.currentAction !== 'left') {
        this.currentAction = 'left';
        this.triggerLeftAction();
      }
    }
  }

  triggerLeftAction() {
    if (this.lastTriggerCall != 'left') {
      clearTimeout(this.timerId);
      this.lastTriggerCall = 'left';
      this.play('left');
      this.currentAction = null;
    }
  }

  triggerRightAction() {
    if (this.lastTriggerCall != 'right') {
      clearTimeout(this.timerId);
      this.lastTriggerCall = 'right';
      this.play('right');
      this.currentAction = null;
    }
  }

  triggerVerticalAction() {
    if (this.lastTriggerCall != 'vertical') {
      clearTimeout(this.timerId);
      this.lastTriggerCall = 'vertical';
      this.play('vertical');
      CapacitorFlash.switchOn({ intensity: 1 }).then(
        () =>
          (this.timerId = setTimeout(() => {
            CapacitorFlash.switchOff();
            this.currentAction = null;
          }, 5000))
      );
    }
  }

  triggerHorizontalAction() {
    if (this.lastTriggerCall != 'horizontal') {
      clearTimeout(this.timerId);
      this.lastTriggerCall = 'horizontal';
      this.play('horizontal');
      Haptics.vibrate({ duration: 5000 }).then(() => {
        this.timerId = setTimeout(() => {
          this.currentAction = null;
        }, 5000);
      });
    }
  }

  triggerAlarm() {
    this.lastTriggerCall = 'alarm';
    this.play('alarm');
    Haptics.vibrate({ duration: 5000 });
    CapacitorFlash.switchOn({ intensity: 1 }).then(() =>
      setTimeout(() => {
        CapacitorFlash.switchOff();
        this.audio.pause();
      }, 5000)
    );
  }

  stopListening() {
    if (this.accelHandler) {
      this.accelHandler.remove();
      this.accelHandler = null;
    }
    this.currentAction = null;
    this.lastTriggerCall = '';
  }

  ngOnDestroy() {
    this.stopListening();
    Motion.removeAllListeners();
    clearTimeout(this.timerId);
  }
}
