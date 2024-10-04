import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { collection, getDocs, query, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { getAuth } from 'firebase/auth';

import { UserInterface } from '../interfaces/user.interface';
import { Observable, from } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firestore = inject(Firestore);
  firebaseAuth = inject(Auth);

  userCollectionName = 'users';
  historyCollectionName = 'loginHistory';
  constructor(private router: Router) {}

  login(email: string, password: string) {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(() => {});
    return from(promise);
  }

  logout() {
    this.firebaseAuth.signOut().then(() => this.router.navigate(['login']));
  }

  getCurrentUserEmail() {
    const user = this.firebaseAuth.currentUser;
    if (user) {
      console.log(user, 'userr');
      return user.email;
    } else {
      console.warn('No hay un usuario autenticado.');
      return null; // o algún valor por defecto
    }
  }
  getUserByEmail(email: string): Observable<UserInterface | undefined> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('correo', '==', email));

    return new Observable<UserInterface | undefined>((observer) => {
      getDocs(q)
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const data = doc.data() as UserInterface;
            const userData = { ...data, id: doc.id };
            observer.next(userData);
          });
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
