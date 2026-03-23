export type Creator = {
  id: string; slug: string; name: string; instagram: string | null
  niche: string | null; achievements: string | null; ai_intro: string | null; created_at: string
}
export type Question = {
  id: string; creator_id: string; position: number; label: string
  question: string; example: string | null; is_custom: boolean
}
export type Answer = {
  id: string; question_id: string; creator_id: string
  answer: string; created_at: string; updated_at: string
}

export const DEFAULT_QUESTIONS = [
  {
    position: 1,
    label: 'Origin Story',
    question: 'Was war dein ursprünglicher Grund anzufangen – und hat sich dieser über die Zeit verändert?',
    example: 'z. B.: „Ich hab angefangen um meiner Leidenschaft für Fitness eine Plattform zu geben. Heute ist es mein Business, meine Community und meine größte Verantwortung – das hätte ich mir damals nie vorgestellt."',
  },
  {
    position: 2,
    label: 'Game-Changer Moment',
    question: 'Erzähl mir von DEM EINEN TAG, an dem sich alles änderte – dein persönlicher „Oh shit, das ist real"-Moment.',
    example: 'z. B.: „Als mein erstes Video über Nacht viral ging und ich morgens aufgewacht bin mit 50.000 neuen Followern – und keine Ahnung hatte was ich damit machen soll."',
  },
  {
    position: 3,
    label: 'Das System hinter dem Erfolg',
    question: 'Beschreib mir deinen echten Arbeitsalltag – nicht den den du postest, sondern den der wirklich hinter deinem Erfolg steckt.',
    example: 'z. B.: „Ich bin um 6 Uhr auf, filme bis 10, dann drei Stunden Schnitt, Nachmittags Calls und Strategie. Glamourös ist anders – aber genau das ist mein System."',
  },
  {
    position: 4,
    label: 'Peak Performance',
    question: 'Wann und was brauchst du um am produktivsten zu sein – und was brauchst du um abzuschalten?',
    example: 'z. B.: „Produktiv bin ich morgens mit Kaffee, ohne Handy und mit klarem Plan. Abschalten geht nur durch Sport oder komplett offline sein – sonst dreht mein Kopf weiter."',
  },
  {
    position: 5,
    label: '„F**k it"-Moment',
    question: 'Welche goldene Creator-Regel musstest du brechen, um erfolgreich zu werden?',
    example: 'z. B.: „Alle sagten täglich posten. Ich hab aufgehört und bin gewachsen."',
  },
  {
    position: 6,
    label: 'Die mutige Entscheidung',
    question: 'Welche Entscheidung haben alle kritisiert – die dich aber weitergebracht hat?',
    example: 'z. B.: „Ich hab meinen sicheren Job gekündigt bei 5.000 Followern. Alle dachten ich bin verrückt."',
  },
  {
    position: 7,
    label: 'Fast aufgehört',
    question: 'Gab es einen Moment, in dem du fast aufgehört hättest – und wie bist du da rausgekommen?',
    example: 'z. B.: „Nach 8 Monaten ohne Wachstum war ich kurz davor alles hinzuschmeißen. Dann kam ein DM von jemandem dessen Leben ich verändert hatte."',
  },
  {
    position: 8,
    label: 'Der Preis des Erfolgs',
    question: 'Was hat dein Erfolg wirklich gekostet – und war es das wert?',
    example: 'z. B.: „Freundschaften, Beziehungen, meine Gesundheit für eine Phase. Heute sage ich ja – aber es war kein gerader Weg."',
  },
  {
    position: 9,
    label: 'Die unbequeme Wahrheit',
    question: 'Was wissen erfolgreiche Creator, das Anfänger nicht hören wollen – aber unbedingt brauchen?',
    example: 'z. B.: „Dass Talent nichts zählt wenn du nicht bereit bist, jahrelang für fast niemanden zu machen was du liebst."',
  },
  {
    position: 10,
    label: 'Größter Fehler',
    question: 'Was war dein teuerster Fehler als Creator – und was hat er dich gelehrt?',
    example: 'z. B.: „Ich hab einen Brand Deal unterschrieben ohne den Vertrag zu lesen – und danach monatelang Content gemacht den ich hasste."',
  },
  {
    position: 11,
    label: 'Finaler Rat',
    question: 'EIN Satz an jeden, der Boss Creator werden will.',
    example: 'z. B.: „Fang heute an – nicht wenn du bereit bist, denn bereit wirst du nie sein."',
  },
  {
    position: 12,
    label: 'Die unsichtbaren Helden',
    question: 'Stecken andere Menschen hinter deinem Erfolg – und welche Rolle haben sie gespielt?',
    example: 'z. B.: „Ohne meine beste Freundin die mich damals vor die Kamera gezerrt hat, hätte ich nie angefangen. Und ohne mein heutiges Team würde ich heute nicht mal halb so viel schaffen."',
  },
]
