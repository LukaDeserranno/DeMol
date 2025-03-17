export interface Candidate {
  id: string;
  name: string;
  age: number;
  image: string;
  bio?: string;
}

// Current candidates data with local images
export const CANDIDATES: Candidate[] = [
  { id: 'sarah', name: 'Sarah', age: 36, image: '/images/sarah2025-copy-st86bp.jpg', bio: 'Sarah is 36 jaar en een zorgzame pleegmoeder van vier kinderen. Ze werkt als coördinator in de revalidatiesector en is erg gedreven om anderen te helpen.' },
  { id: 'michele', name: 'Michèle', age: 35, image: '/images/michele2025-copy-st85z6.jpg', bio: 'Michèle is 35 jaar en werkt als hoofdverpleegkundige. Ze staat bekend om haar scherpe observatievaardigheden en haar vermogen om kalm te blijven onder druk.' },
  { id: 'pedro', name: 'Pedro', age: 41, image: '/images/pedro2025-copy-st867t.jpg', bio: 'Pedro is 41 jaar en werkt als leerkracht. Zijn enthousiasme en sociale vaardigheden maken hem geliefd bij zijn studenten, maar achter die vrolijke façade schuilt wellicht een strategisch brein.' },
  { id: 'nimrod', name: 'Nimrod', age: 25, image: '/images/nimrod2025-copy-st8610.jpg', bio: 'Nimrod is met zijn 25 jaar de jongste kandidaat. Hij werkt als ingenieur en combineert technisch inzicht met een competitieve geest en doorzettingsvermogen.' },
  { id: 'pasquino', name: 'Pasquino', age: 33, image: '/images/pasquino2025-copy-st866b.jpg', bio: 'Pasquino is 33 jaar en werkt als creatief directeur. Hij denkt out-of-the-box en heeft een scherp oog voor detail, wat hem zowel een sterke kandidaat als een potentiële mol maakt.' },
  { id: 'rusiana', name: 'Rusiana', age: 39, image: '/images/rusiana2025-copy-st869i.jpg', bio: 'Rusiana is 39 jaar en werkt als HR-manager. Ze is analytisch, geduldig en heeft een talent om mensen te lezen, wat haar een geducht tegenstander maakt in het spel.' },
  { id: 'alexy', name: 'Alexy', age: 23, image: '/images/alexy2025-copy-st85lt.jpg', bio: 'Alexy is 23 jaar en werkt als fitnessinstructeur. Zijn fysieke kracht en doorzettingsvermogen maken hem een sterke deelnemer bij uitdagende opdrachten.' },
  { id: 'els', name: 'Els', age: 28, image: '/images/els2025-copy-st85rz.jpg', bio: 'Els is 28 jaar en werkt als grafisch ontwerper. Ze heeft een creatieve geest en oog voor detail, wat haar helpt bij puzzels en creatieve opdrachten.' },
  { id: 'hilde', name: 'Hilde', age: 57, image: '/images/hilde2025-copy-st85vh.jpg', bio: 'Hilde is met haar 57 jaar de meest ervaren kandidaat. Ze werkt als consultant en brengt wijsheid en levenservaring mee, wat haar een sterke strategie geeft.' },
  { id: 'jan', name: 'Jan', age: 40, image: '/images/jan2025-copy-st85xe.jpg', bio: 'Jan is 40 jaar en werkt als ondernemer. Hij is zelfverzekerd, competitief en heeft een strategische aanpak voor elke uitdaging die hij tegenkomt.' },
]; 