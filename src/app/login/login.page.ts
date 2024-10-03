import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { FirebaseError } from '@angular/fire/app';
import { authErrors } from '../services/auth.errors';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonInputPasswordToggle,
    CommonModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
  ],
})
export class LoginPage {
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  errorMessage: string | undefined = undefined;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private spinner: NgxSpinnerService
  ) {}

  handleSubmit() {
    this.spinner.show();

    // Verifica si el formulario es inválido
    if (this.form.invalid) {
      // Inicializa el mensaje de error
      this.errorMessage = '';

      // Verifica el email
      if (this.form.controls['email'].invalid) {
        this.errorMessage = 'El correo electrónico es inválido.';
      }

      // Verifica la contraseña
      if (this.form.controls['password'].invalid) {
        this.errorMessage += this.errorMessage ? ' ' : ''; // Espacio si ya hay un mensaje
        this.errorMessage += 'La contraseña es requerida.';
      }

      // Si no hay un mensaje específico, muestra un mensaje general
      if (!this.errorMessage) {
        this.errorMessage =
          'Por favor, complete todos los campos correctamente.';
      }

      this.spinner.hide();
      return;
    }

    const { email, password } = this.form.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.spinner.hide();
        this.errorMessage = undefined;
        this.form.controls['email'].setValue('');
        this.form.controls['password'].setValue('');
        this.router.navigateByUrl('home');
      },
      error: (err: FirebaseError) => {
        let errorMessage = 'Se produjo un error desconocido.';
        for (const error of authErrors) {
          if (error.code === err.code) {
            errorMessage = error.message;
            break;
          }
        }
        this.errorMessage = errorMessage;
        this.spinner.hide();
      },
    });
  }

  handleQuickAccess(email: string, password: string) {
    this.errorMessage = '';
    this.form.controls['email'].setValue(email);
    this.form.controls['password'].setValue(password);
  }

  onInputChange() {
    this.errorMessage = '';
  }
}
