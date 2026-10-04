/* Tout ce jeu est fictif. Coordonnées approximatives des points de départ,
   sans validation terrain. Les polylignes sont uniquement des motifs visuels. */
(function () {
  'use strict';
  window.POPCORN_SEGMENTS = [
    {id:'seine',name:'La Seine en douceur',area:'Berges de Seine · Paris 4e',km:2.4,gain:8,pedestrian:95,sidewalk:5,lights:0,lat:48.8527,lon:2.3563,shape:'M15 85 Q60 20 95 58 T180 40 Q230 18 280 55',tag:'Au fil de l’eau',description:'Un défi de démonstration inspiré des quais : régulier, roulant et idéal pour découvrir le concept.'},
    {id:'villette',name:'Le tour du canal',area:'La Villette · Paris 19e',km:3.6,gain:12,pedestrian:85,sidewalk:15,lights:1,lat:48.8897,lon:2.3783,shape:'M25 70 L110 30 L225 30 Q275 30 265 65 L170 105 L70 105 Z',tag:'L’esprit du canal',description:'Un parcours fictif inspiré de La Villette, entre lignes droites et virages au bord de l’eau.'},
    {id:'vincennes',name:'L’échappée du bois',area:'Bois de Vincennes · Paris 12e',km:5.2,gain:28,pedestrian:100,sidewalk:0,lights:0,lat:48.8326,lon:2.4331,shape:'M35 80 Q5 25 80 25 L210 22 Q280 25 258 82 Q220 110 155 85 Q80 120 35 80 Z',tag:'Respirer un peu',description:'Un segment de démonstration qui évoque les allées du bois. Les mesures et le tracé ne sont pas réels.'},
    {id:'montmartre',name:'La montée des artistes',area:'Montmartre · Paris 18e',km:2.1,gain:145,pedestrian:30,sidewalk:65,lights:5,lat:48.8848,lon:2.3380,shape:'M20 105 L80 90 L62 70 L150 65 L130 42 L220 38 L270 15',tag:'Un peu de relief',description:'Un défi fictif inspiré du relief de Montmartre. Aucune rue ni marche précise n’est proposée.'},
    {id:'boulogne',name:'La grande boucle',area:'Bois de Boulogne · Paris 16e',km:8.4,gain:46,pedestrian:95,sidewalk:5,lights:1,lat:48.8644,lon:2.2530,shape:'M35 90 Q0 35 78 20 Q140 5 180 35 Q280 15 275 75 Q235 125 150 98 Q100 120 35 90 Z',tag:'Pour aller plus loin',description:'Une longue boucle de démonstration. Les distances et le relief servent à essayer les filtres de difficulté.'},
    {id:'sceaux',name:'Les allées du château',area:'Parc de Sceaux · Hauts-de-Seine',km:4.5,gain:58,pedestrian:100,sidewalk:0,lights:0,lat:48.7727,lon:2.2971,shape:'M20 70 L85 70 L85 25 L215 25 L215 100 L130 100 L130 70 L270 70',tag:'Le vert à perte de vue',description:'Un segment fictif inspiré des grandes perspectives du parc de Sceaux.'},
    {id:'saintcloud',name:'Les hauteurs du parc',area:'Saint-Cloud · Hauts-de-Seine',km:6.2,gain:180,pedestrian:90,sidewalk:10,lights:0,lat:48.8375,lon:2.2140,shape:'M20 100 Q90 50 55 30 Q110 5 160 55 Q210 100 250 48 L275 15',tag:'Le défi qui grimpe',description:'Un effort de démonstration plus exigeant, où distance et dénivelé s’additionnent.'},
    {id:'luxembourg',name:'Le petit tour du jardin',area:'Luxembourg · Paris 6e',km:1.7,gain:5,pedestrian:100,sidewalk:0,lights:0,lat:48.8467,lon:2.3372,shape:'M50 90 L50 30 Q150 0 250 30 L250 90 Q150 120 50 90 Z',tag:'Le premier pas',description:'Un tour entièrement fictif pour découvrir Popcorn sur une distance courte.'}
  ];
  window.POPCORN_RUNNERS = [
    {name:'Camille R.',secondsPerKm:238,color:'peach'},
    {name:'Alex M.',secondsPerKm:251,color:'mint'},
    {name:'Lou D.',secondsPerKm:268,color:'lavender'},
    {name:'Sam B.',secondsPerKm:290,color:'yellow'},
    {name:'Noa L.',secondsPerKm:315,color:'peach'}
  ];
})();
