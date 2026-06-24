import fs from "fs";
import { ALL_PLAYERS } from "./src/db/seeds/players.js";

const jsonRaw = fs.readFileSync("./public/official/official_players.json", "utf-8");
const officialPlayers = JSON.parse(jsonRaw);

const normalize = (s: string) => 
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f\-]/g, "").trim();

const squadMap: Record<string, number> = {
  "Mexico": 28, "South Africa": 40, "South Korea": 27, "Czechia": 15, "Canada": 9,
  "Bosnia-Herzegovina": 6, "Qatar": 36, "Switzerland": 43, "Morocco": 29, "Haiti": 22,
  "Scotland": 38, "United States": 47, "Australia": 3, "Paraguay": 34, "Türkiye": 45,
  "Germany": 20, "Curacao": 14, "Côte d'Ivoire": 12, "Ecuador": 16, "Netherlands": 30,
  "Japan": 25, "Sweden": 42, "Tunisia": 44, "Belgium": 5, "Egypt": 17, "Iran": 23,
  "New Zealand": 31, "Spain": 41, "Cabo Verde": 8, "Uruguay": 46, "France": 19,
  "Senegal": 39, "Iraq": 24, "Norway": 32, "Argentina": 2, "Algeria": 1, "Austria": 4,
  "Congo DR": 11, "Uzbekistan": 48, "Colombia": 10, "England": 18, "Croatia": 13,
  "Ghana": 21, "Panama": 33, "Brazil": 7, "Saudi Arabia": 37, "Jordan": 26, "Portugal": 35
};

const missing = [
"Jo Hyun-Woo",
"Kim Tae-Hyun",
"Park Jin-Seop",
"Lee Ki-Hyeok",
"Kim Jin-Kyu",
"Oh Hyun-Kyu",
"Cho Kyu-Sung",
"Jan Koutny",
"Ayoub Al-Alawi",
"Ehsan Hajsafi",
"Hossein Kanaani",
"Mehdi Ghaedi",
"Al-Hashmi Al-Hussain",
"Ahmed Al-Ganehi",
"Hassan Al-Haydos",
"Meschak Elia",
"Nour Bani Attiah",
"Mohammed Abu Hashish",
"Baba Abdul Rahman",
"Matej Vydra",
"Homam Al-Amin",
"Ahmed Fathi",
"Carl Fred Sainté",
"Don Deedson Louicius",
"Ali Al-Hamadi",
"Zaid Ismail",
"Ahmed Qasim",
"Ali Yousef",
"Fredrik André Bjørkan",
"Hakan Calhanoglou",
"Baris Apler Yilmaz",
"Abdullah Al Hamdan",
"Abduvokhid Nematov",
"Avazbek Ulmasaliev",
"Idrissa Gana Gueye",
"Manaf Younis",
"Akam Hashem",
"Hassan Kadesh",
"Melvin Masstil",
"Mohamed Amine Tougai",
"Mohamed Amine Amoura",
"Mohamed Amine Ben Hamida",
"Mostafa Ziko",
"Prince Kwabena Adu",
"Ali Nemati Omid Noorafkan",
"Amir Al-Ammari",
"Saed Al-Rosan",
"Mohammad Abualnadi",
"Yazan Al-Arab",
"Nizar Al-Rashdan",
"Noor Al-Rawabdeh",
"Mousa Al-Tamari",
"Mahmoud Al-Mardi",
"Kaku ",
"Pascal Gross",
"Lawrence Ati-Zigi",
"Abdul Fatawu Issahaku",
"Abdallah Al-Fakhouri",
"Rajaei Ayed",
"Maximiliano Araújo",
"Nawaf Boushal",
"Sultan Al-Ghannam",
"Alaa Al Hajji",
"Firas Al Buraikan",
"Mohammed Al-Dawoud",
"Mohammed Abu Zrayq",
"Odeh Al-Fakhouri",
"Azizjon Ganiev",
"Azizbek Amonov"
];

for (const m of missing) {
  const dbP = ALL_PLAYERS.find(p => (p.firstName + " " + p.lastName).trim() === m.trim());
  if (!dbP) continue;
  const candidates = officialPlayers.filter((op: any) => op.squadId === squadMap[dbP.nation]);
  
  console.log(`\n=== MISSING: ${m} (${dbP.nation}) ===`);
  candidates.forEach((op: any) => {
    console.log(`   JSON: ID=${op.id} | Name=${op.firstName} ${op.lastName} | Known=${op.knownName || ''}`);
  });
}
