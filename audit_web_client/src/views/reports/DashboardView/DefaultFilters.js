const defaultUserFilters = {
  unregistered: true,
  registered: false,
  newcomers: true,
  learners: true,
  experienced: true,
  bots: false,
}

const defaultRevisionFilters = {
  largeAdditions: true,
  smallAdditions: true,
  neutral: true,
  smallRemovals: true,
  largeRemovals: true,
} 

const defaultMinorFilters = {
  isMinor: true,
  isMajor: true
}

const defaultNamespaceSelected = [{namespace: "Main/Article - 0"}]

const defaultNewcomerUserFilters = {
  unregistered: true,
  registered: false,
  newcomers: true,
  learners: false,
  experienced: false,
  bots: false,
}

const defaultLGBTHistoryFilters = [
  {
      "page_id": "92656",
      "primary_text": "Same-sex marriage",
      "secondary_text": "825"
  },
  {
      "page_id": "41986649",
      "primary_text": "TERF",
      "secondary_text": "668"
  },
  {
      "page_id": "15471",
      "primary_text": "LGBT in Islam",
      "secondary_text": "493"
  },
  {
      "page_id": "47334533",
      "primary_text": "Equality Act (United States)",
      "secondary_text": "417"
  },
  {
      "page_id": "50885567",
      "primary_text": "Transgender history",
      "secondary_text": "414"
  },
  {
      "page_id": "9180166",
      "primary_text": "Gay icon",
      "secondary_text": "397"
  },
  {
      "page_id": "61511950",
      "primary_text": "LGBT-free zone",
      "secondary_text": "375"
  },
  {
      "page_id": "3510770",
      "primary_text": "LGBT rights in the United States",
      "secondary_text": "363"
  },
  {
      "page_id": "5048086",
      "primary_text": "Unisex public toilet",
      "secondary_text": "360"
  },
  {
      "page_id": "29383",
      "primary_text": "Stonewall riots",
      "secondary_text": "318"
  },
  {
      "page_id": "20308698",
      "primary_text": "List of people killed for being transgender",
      "secondary_text": "290"
  },
  {
      "page_id": "5139910",
      "primary_text": "Homosexuality in ancient Rome",
      "secondary_text": "287"
  },
  {
      "page_id": "7952150",
      "primary_text": "Same-sex marriage in Taiwan",
      "secondary_text": "256"
  },
  {
      "page_id": "23712287",
      "primary_text": "Same-sex union legislation",
      "secondary_text": "256"
  },
  {
      "page_id": "38473049",
      "primary_text": "Same-sex union court cases",
      "secondary_text": "251"
  },
  {
      "page_id": "60269491",
      "primary_text": "Rapid onset gender dysphoria controversy",
      "secondary_text": "250"
  },
  {
      "page_id": "20979518",
      "primary_text": "List of LGBT firsts by year",
      "secondary_text": "245"
  },
  {
      "page_id": "50402549",
      "primary_text": "Capital punishment for homosexuality",
      "secondary_text": "242"
  },
  {
      "page_id": "59476366",
      "primary_text": "Timeline of LGBT history, 21st century",
      "secondary_text": "219"
  },
  {
      "page_id": "55294615",
      "primary_text": "SOGIE Equality Bill",
      "secondary_text": "211"
  },
  {
      "page_id": "445587",
      "primary_text": "Stonewall (charity)",
      "secondary_text": "206"
  },
  {
      "page_id": "12813031",
      "primary_text": "Rainbow flag (LGBT)",
      "secondary_text": "206"
  },
  {
      "page_id": "50787160",
      "primary_text": "Orlando nightclub shooting",
      "secondary_text": "189"
  },
  {
      "page_id": "60464168",
      "primary_text": "Department of Defense Instruction 1300.28",
      "secondary_text": "188"
  },
  {
      "page_id": "61080885",
      "primary_text": "Lesbian erasure",
      "secondary_text": "184"
  },
  {
      "page_id": "60861122",
      "primary_text": "National LGBTQ Wall of Honor",
      "secondary_text": "182"
  },
  {
      "page_id": "54602493",
      "primary_text": "History of the Catholic Church and homosexuality",
      "secondary_text": "175"
  },
  {
      "page_id": "61534486",
      "primary_text": "Transgender Persons (Protection of Rights) Act, 2019",
      "secondary_text": "175"
  },
  {
      "page_id": "4732778",
      "primary_text": "LGBT rights in Australia",
      "secondary_text": "164"
  },
  {
      "page_id": "60522173",
      "primary_text": "Lavender Hill Mob (gay activist group)",
      "secondary_text": "153"
  },
  {
      "page_id": "46206247",
      "primary_text": "Homophobia in ethnic minority communities",
      "secondary_text": "149"
  },
  {
      "page_id": "947776",
      "primary_text": "Campaign for Homosexual Equality",
      "secondary_text": "148"
  },
  {
      "page_id": "60345163",
      "primary_text": "Queens Pride Parade",
      "secondary_text": "143"
  },
  {
      "page_id": "275051",
      "primary_text": "HIV/AIDS denialism",
      "secondary_text": "142"
  }
]

export default {
  defaultUserFilters,
  defaultRevisionFilters,
  defaultMinorFilters,
  defaultNamespaceSelected,
  defaultNewcomerUserFilters,
  defaultLGBTHistoryFilters
}