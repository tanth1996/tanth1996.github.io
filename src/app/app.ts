import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IntroAnimation } from './intro-animation/intro-animation';
import { DbAnimation } from './3d/db-animation/db-animation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IntroAnimation, DbAnimation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isIntroDone = signal<boolean>(false);

  isNavExpanded = false;

  onIntroDone() {
    this.isIntroDone.set(true);
  }

  /**
   * Toggles the navigation card dropdown state.
   * Prevents toggling if the user clicked an actual link item.
   */
  toggleNav(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      return;
    }
    this.isNavExpanded = !this.isNavExpanded;
  }

  /**
   * Explicitly closes the navigation menu (e.g., after clicking a link)
   */
  closeNav(): void {
    this.isNavExpanded = false;
  }
}
