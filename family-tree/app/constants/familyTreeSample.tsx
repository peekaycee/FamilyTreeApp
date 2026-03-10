import HeroPics from '@/public/images/pee2.png';
import Staff1 from '@/public/images/staff1.png';
import Staff2 from '@/public/images/staff2.png';
import Staff3 from '@/public/images/staff3.png';

export const familyTreeSample = [
  { id: "p1", name: "Grandmother", birth: 1920, children: ["p2", "p3"], img: HeroPics, description: "A pioneer who started the craft business that supported the family for decades." },
  { id: "p2", name: "Father", birth: 1950, children: ["p4"], img: Staff1, description: "Second description." },
  { id: "p3", name: "Aunt", birth: 1953, children: [], img: Staff2, description: "Third description." },
  { id: "p4", name: "You", birth: 1985, children: [], img: Staff3, description: "Fourth description." },
];