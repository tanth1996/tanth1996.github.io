import { Component } from '@angular/core';

export interface ResourceLink {
  title: string;
  url: string;
  description: string;
}

@Component({
  selector: 'app-learning-resources',
  standalone: true,
  imports: [],
  templateUrl: './learning-resources.html',
  styleUrls: ['./learning-resources.scss'],
})
export class LearningResources {
  resources: ResourceLink[] = [
    {
      title: 'ByteByteGo',
      url: 'https://www.youtube.com/playlist?list=PLCRMIe5FDPsd0gVs500xeOewfySTsmEjf',
      description: 'System design made digestable. I recommend their newsletter too.',
    },
    {
      title: "Robert C. Martin's (Uncle Bob) Clean Code talks",
      url: 'https://www.youtube.com/watch?v=7EmboKQH8lM&list=PLmmYSbUCWJ4x1GO839azG_BBw8rkh-zOj&index=1',
      description: "\"You're not done when it works, you're done when it's right.\"",
    },
    {
      title: "Martin Kleppmann's Distributed Systems lectures",
      url: 'https://www.youtube.com/watch?v=UEAMfLPZZhE&list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB',
      description:
        'Great primer on distributed systems by the man behind Designing Data-Intensive Applications himself.',
    },
    {
      title: '3Blue1Brown',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      description:
        'Math explained and visualised beautifully. I owe my intuition of the transformer architecture to this content.',
    },
    {
      title: 'Core Dumped',
      url: 'https://www.youtube.com/playlist?list=PL9vTTBa7QaQPdvEuMTqS9McY-ieaweU8M',
      description: 'Peels back the curtain on how computers actually work.',
    },
  ];
}
