import { Component, output } from '@angular/core';

@Component({
  selector: 'app-intro-animation',
  imports: [],
  templateUrl: './intro-animation.html',
  styleUrl: './intro-animation.scss',
})
export class IntroAnimation {
  fadeOutDoneEvent = output<void>();

  onFadeOutDone(event: AnimationEvent) {
    if (event.target !== event.currentTarget) {
      return;
    }
    this.fadeOutDoneEvent.emit();
  }
}
