import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IntroAnimation } from './intro-animation/intro-animation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IntroAnimation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isIntroDone = signal<boolean>(false);

  onIntroDone() {
    this.isIntroDone.set(true);
  }
}
