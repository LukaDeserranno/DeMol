# De Mol Voting App


## Projectbeschrijving
Deze applicatie stelt gebruikers in staat om tijdens elke eliminatieronde van het tv-programma "De Mol" te stemmen op wie zij denken dat De Mol is. Gebruikers kunnen punten verdelen over de kandidaten, en degene die op het einde de meeste punten op De Mol heeft gezet, wint het spel. De applicatie maakt gebruik van JavaScript React (met Vite) en Firebase (Firestore en Authentication) zonder traditionele backend en tailwindcss.

## Functionaliteiten
layout: heeft een mooie header, footer de officiele kleuren/theme van de mol wordt geimplementeerd (zie goplay.be) https://www.goplay.be/de-mol
Gebruikersauthenticatie: Registreren en inloggen via Firebase Authentication.
Groepen: Gebruikers kunnen groepen aanmaken en anderen uitnodigen via e-mail, whatsapp, messenger, sms. Binnen groepen kun je de voting stats zien dit zijn stats zoals de 3 meest verdachte van de groep, per gebruiker een overzicht van hoeveel punten hij op welke candidaat heeft gezet (dit moet opgeteld worden van alle rondes)
Stemmen: Gebruikers verdelen 100 punten per stemronde over de resterende kandidaten. dit met een soort slider systeem per kandidaat
Stemrondes: Een stemronde sluit automatisch op zondag om 20:00 wanneer de volgende aflevering online komt. De eerste stemronde start op zondag 23/03 om 20:00.
Dashboard: Stemmingen worden centraal opgeslagen. Gebruikers stemmen één keer per ronde en deze resultaten worden getoond in alle groepen waarvan ze lid zijn, een stem is dus niet gelinkt aan een groep maar enkel aan een user, een user is op zijn plaats gelinkt aan een groep. in het dashboard moeten ook meteen stats getoond worden zoals de top 3 verdachten en de 3 minst verdachten en de verdeling van stemmen over de kandidaten. ook moet je in je dashboard je groepen kunnen zien waar je lid van bent en een overzicht van de kandidaten en een mooie banner vanboven

## DataModellen
- User
- Group
- VotingRound
- Candidate : 
{ name: "Sarah" (string),
age: 36 (number), 
bio: "Sarah is 36 jaar en een zorgzame pleegmoeder van vier kinderen. Ze werkt als coördinator in de revalidatiesector en is erg gedreven om anderen te helpen."(string),
eliminated: false (Boolean),
image: "/images/sarah2025-copy-st86bp.jpg" (string) }

## Services