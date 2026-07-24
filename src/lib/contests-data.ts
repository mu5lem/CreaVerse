export interface Contest {
  id: string;
  name: string;
  category:
    | "Olympiad"
    | "Programming"
    | "Robotics"
    | "Science Fair"
    | "Debate/MUN"
    | "Hackathon"
    | "Writing/Arts"
    | "Business";
  scope: "Pakistan" | "Global";
  description: string;
  link: string;
}

export const contests: Contest[] = [
  // ── International Olympiads ──
  { id: "imo", name: "International Mathematical Olympiad (IMO)", category: "Olympiad", scope: "Global", description: "The most prestigious high-school math competition; Pakistan sends a national team every year.", link: "https://www.imo-official.org" },
  { id: "ioi", name: "International Olympiad in Informatics (IOI)", category: "Olympiad", scope: "Global", description: "Global programming/algorithms olympiad for high-school students.", link: "https://ioinformatics.org" },
  { id: "ipho", name: "International Physics Olympiad (IPhO)", category: "Olympiad", scope: "Global", description: "Global physics competition for pre-university students.", link: "https://ipho-unofficial.org" },
  { id: "icho", name: "International Chemistry Olympiad (IChO)", category: "Olympiad", scope: "Global", description: "Global chemistry olympiad for high schoolers.", link: "https://www.ichosc.org" },
  { id: "ibo", name: "International Biology Olympiad (IBO)", category: "Olympiad", scope: "Global", description: "Global biology olympiad testing theory and practical skills.", link: "https://www.ibo-info.org" },
  { id: "ioaa", name: "International Olympiad on Astronomy & Astrophysics", category: "Olympiad", scope: "Global", description: "Astronomy olympiad for high-school students worldwide.", link: "https://www.ioaastrophysics.org" },
  { id: "igeo", name: "International Geography Olympiad (iGeo)", category: "Olympiad", scope: "Global", description: "Global geography olympiad with written, multimedia and fieldwork tests.", link: "https://geoolympiad.org" },
  { id: "iesos", name: "International Earth Science Olympiad (IESO)", category: "Olympiad", scope: "Global", description: "Global olympiad on geology, meteorology and environmental sciences.", link: "https://www.ieso-info.org" },
  { id: "iolo", name: "International Linguistics Olympiad (IOL)", category: "Olympiad", scope: "Global", description: "Puzzle-based olympiad on languages and linguistics.", link: "https://ioling.org" },
  { id: "ijso", name: "International Junior Science Olympiad (IJSO)", category: "Olympiad", scope: "Global", description: "Multidisciplinary science olympiad for students aged ≤15.", link: "https://ijsoweb.org" },

  // ── Programming / CS ──
  { id: "icpc", name: "ACM ICPC — International Collegiate Programming Contest", category: "Programming", scope: "Global", description: "The world championship of university algorithmic programming.", link: "https://icpc.global" },
  { id: "cf", name: "Codeforces Rounds", category: "Programming", scope: "Global", description: "Weekly online algorithm contests with a global rating system.", link: "https://codeforces.com" },
  { id: "topcoder", name: "Topcoder Open", category: "Programming", scope: "Global", description: "Annual global tournament in algorithm, dev and design tracks.", link: "https://www.topcoder.com/tco" },
  { id: "atcoder", name: "AtCoder Grand Contest", category: "Programming", scope: "Global", description: "High-level Japanese algorithm contest platform with global entries.", link: "https://atcoder.jp" },
  { id: "meta-hacker", name: "Meta Hacker Cup", category: "Programming", scope: "Global", description: "Meta's annual algorithm programming championship with cash prizes.", link: "https://www.facebook.com/codingcompetitions/hacker-cup" },
  { id: "kaggle", name: "Kaggle Competitions", category: "Programming", scope: "Global", description: "Global data-science and machine-learning competitions with real prize money.", link: "https://www.kaggle.com/competitions" },

  // ── Hackathons ──
  { id: "nasa-space", name: "NASA Space Apps Challenge", category: "Hackathon", scope: "Global", description: "World's largest annual hackathon, with local chapters in many Pakistani cities.", link: "https://www.spaceappschallenge.org" },
  { id: "google-solution", name: "Google Solution Challenge", category: "Hackathon", scope: "Global", description: "Global student challenge to solve UN SDGs using Google technologies.", link: "https://developers.google.com/community/gdsc-solution-challenge" },
  { id: "mlh", name: "MLH Local Hack Days", category: "Hackathon", scope: "Global", description: "Weekend hackathons run by Major League Hacking around the world.", link: "https://mlh.io" },
  { id: "psl", name: "Pakistan Software League / Devsinc Hackathons", category: "Hackathon", scope: "Pakistan", description: "Recurring Pakistan-based hackathons run by leading local tech companies.", link: "https://devsinc.com" },

  // ── Robotics ──
  { id: "first-frc", name: "FIRST Robotics Competition (FRC)", category: "Robotics", scope: "Global", description: "High-school robotics competition with worldwide regionals and championship.", link: "https://www.firstinspires.org/robotics/frc" },
  { id: "ftc", name: "FIRST Tech Challenge (FTC)", category: "Robotics", scope: "Global", description: "Smaller-scale FIRST robotics program for grades 7–12.", link: "https://www.firstinspires.org/robotics/ftc" },
  { id: "wro", name: "World Robot Olympiad (WRO)", category: "Robotics", scope: "Global", description: "International student robotics competition using LEGO Education platforms.", link: "https://wro-association.org" },
  { id: "vex", name: "VEX Robotics World Championship", category: "Robotics", scope: "Global", description: "One of the largest robotics competitions in the world across school & university levels.", link: "https://www.vexrobotics.com/competition" },
  { id: "natrocc", name: "National Robotics Competition — NUST", category: "Robotics", scope: "Pakistan", description: "Annual NUST robotics competition hosted at the College of E&ME, Rawalpindi.", link: "https://ceme.nust.edu.pk" },

  // ── Science Fair / Talent ──
  { id: "nstc", name: "National Science Talent Contest (NSTC) — Pakistan", category: "Science Fair", scope: "Pakistan", description: "STEM talent contest by the Pakistan Science Foundation for school students.", link: "https://www.psf.gov.pk" },
  { id: "isef", name: "Regeneron International Science and Engineering Fair (ISEF)", category: "Science Fair", scope: "Global", description: "Largest pre-college science fair in the world.", link: "https://www.societyforscience.org/isef/" },
  { id: "google-sf", name: "Google Science Fair (revival editions)", category: "Science Fair", scope: "Global", description: "Historically Google's global online science fair for ages 13–18.", link: "https://en.wikipedia.org/wiki/Google_Science_Fair" },
  { id: "iris-nat", name: "IRIS National Fair — Pakistan Science Club", category: "Science Fair", scope: "Pakistan", description: "Intel-style science and engineering fair organized in Pakistan.", link: "https://www.pakscienceclub.org" },

  // ── Debate & MUN ──
  { id: "wsdc", name: "World Schools Debating Championships (WSDC)", category: "Debate/MUN", scope: "Global", description: "Global secondary-school debating championship; Pakistan sends a national team.", link: "https://worldschoolsdebating.com" },
  { id: "audc", name: "Asian Universities Debating Championship (AUDC)", category: "Debate/MUN", scope: "Global", description: "Premier English debating competition across Asian universities.", link: "https://en.wikipedia.org/wiki/Asians_British_Parliamentary_Debating_Championships" },
  { id: "wudc", name: "World Universities Debating Championship (WUDC)", category: "Debate/MUN", scope: "Global", description: "Largest annual global university debate championship.", link: "https://en.wikipedia.org/wiki/World_Universities_Debating_Championship" },
  { id: "harvardmun", name: "Harvard Model United Nations (HMUN)", category: "Debate/MUN", scope: "Global", description: "Prestigious high-school MUN conference in Boston, USA.", link: "https://www.harvardmun.org" },
  { id: "lums-mun", name: "LUMUN — LUMS Model United Nations", category: "Debate/MUN", scope: "Pakistan", description: "One of South Asia's largest and oldest MUN conferences.", link: "https://lumun.org.pk" },

  // ── Business & Entrepreneurship ──
  { id: "hult", name: "Hult Prize", category: "Business", scope: "Global", description: "Global student social-entrepreneurship competition with US $1M prize.", link: "https://www.hultprize.org" },
  { id: "hbs-nvc", name: "Harvard New Venture Competition", category: "Business", scope: "Global", description: "HBS-run student startup competition open to select international teams.", link: "https://entrepreneurship.hbs.edu/new-venture-competition/" },
  { id: "jazz-startup", name: "Jazz xlr8 / National Incubation Center Startup Cups", category: "Business", scope: "Pakistan", description: "Pakistan-based startup pitch competitions run by NICs and telecom sponsors.", link: "https://nicp.pk" },

  // ── Writing & Arts ──
  { id: "royal-comm", name: "Queen's / King's Commonwealth Essay Competition", category: "Writing/Arts", scope: "Global", description: "World's oldest international schools' writing competition, open to Commonwealth students.", link: "https://www.royalcwsociety.org/queens-commonwealth-essay-competition" },
  { id: "scholastic", name: "Scholastic Art & Writing Awards", category: "Writing/Arts", scope: "Global", description: "Long-running US-based art/writing awards for teens with international entries.", link: "https://www.artandwriting.org" },
  { id: "youngpoets", name: "Foyle Young Poets of the Year Award", category: "Writing/Arts", scope: "Global", description: "Global poetry competition for writers aged 11–17.", link: "https://poetrysociety.org.uk/competitions/foyle-young-poets-of-the-year-award/" },

  // ── Featured additions ──
  { id: "hacksummer26", name: "HackSummer '26 — GIKI", category: "Hackathon", scope: "Pakistan", description: "Flagship summer hackathon hosted by GIKI (Ghulam Ishaq Khan Institute) for university and senior school students.", link: "https://giki.edu.pk" },
  { id: "technica", name: "Technica — University of Maryland", category: "Hackathon", scope: "Global", description: "The world's largest hackathon for women and non-binary students, open to remote entries.", link: "https://gotechnica.org" },
  { id: "nascon", name: "NASCON — FAST-NUCES", category: "Science Fair", scope: "Pakistan", description: "One of Pakistan's largest student conventions — programming, robotics, gaming, business and science competitions.", link: "https://nascon.pk" },
  { id: "pieas-stc", name: "PIEAS Science Talent Contest", category: "Olympiad", scope: "Pakistan", description: "Annual national science talent competition organised by PIEAS for pre-university students across Pakistan.", link: "https://pieas.edu.pk" },
];

