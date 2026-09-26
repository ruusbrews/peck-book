// The wording of the laws and standards behind the agent's decisions, shown when a
// "Based on" source is clicked. Quotes are copied from the documents the team read.
// QS 10050:2025 is published in Arabic; its English lines are our unofficial translation.

const LAW_8_1990 = 'https://www.almeezan.qa/LawView.aspx?opt=&LawID=2648&language=en';
const CODEX_CXC_8 = 'https://www.fao.org/input/download/standards/285/CXP_008e.pdf';
const QS_10050 =
  'https://qna.org.qa/en/News-Area/News/2025-12/13/minister-of-commerce-industry-issues-decision-adopting-qatari-technical-regulation-on-shelf-life-of-food-products';

export const SOURCE_TEXT = {
  temperatureViolationProcedure: {
    title: 'Codex CXC 8-1976 §5.3 · Temperature violation',
    url: CODEX_CXC_8,
    quote:
      'Loads or parts of loads that are warmer than the temperature required for quick frozen food should be identified and sorted immediately. Delivery, and sale of these loads or parts of loads should be suspended. It is the responsibility of the person in possession of the food to ensure the food safety of the product. Any measures necessary for preserving the food should be taken, including bringing down the temperature immediately. An assessment should be made as to whether the safety or the quality of the product has been compromised and action taken accordingly. Destruction of the product may be necessary, especially if safety provisions are compromised. In cases of compromised safety or quality, the supplier, as well as other relevant parties in the supply chain should be informed of the incident. In the case of compromised safety the competent authorities should also be notified.',
  },
  stockRotation: {
    title: 'Codex CXC 8-1976 §4.6 · Stock rotation',
    url: CODEX_CXC_8,
    quote:
      'Stocks should be rotated to ensure that the products leave the cold store on a "First in-First out" basis or shortest durability date. In no case, should products be stored beyond their specified shelf-life.',
  },
  frozenStorageMaxC: {
    title: 'Codex CXC 8-1976 §4.6 · Frozen storage at −18 °C',
    url: CODEX_CXC_8,
    quote:
      'Cold stores should be designed and operated so as to maintain a product temperature of -18°C or colder with a minimum of fluctuation.',
  },
  frozenAbsoluteMaxC: {
    title: 'Codex CXC 8-1976 §4.7 · Never warmer than −12 °C',
    url: CODEX_CXC_8,
    quote:
      'Distribution of quick frozen foods should be carried out in such a way that any rise in product temperature warmer than -18ºC be kept to a minimum within, as appropriate, the limit set by competent authorities and should not in any case be warmer than -12ºC in the warmest package to ensure quality of the products. After delivery, the product temperature should be reduced to -18°C as soon as possible.',
  },
  transferPointRecords: {
    title: 'Codex CXC 8-1976 §4.8 · Transfer points',
    url: CODEX_CXC_8,
    quote:
      'The product temperature should be checked as necessary, as the product is received or dispatched and a record of these measurements retained for a period that exceeds the shelf-life of the product.',
  },
  indicatorsOnRetailPacks: {
    title: 'Codex CXC 8-1976 Annex §4.4 · Temperature indicators',
    url: CODEX_CXC_8,
    quote:
      'There has been a reluctance to use TIs and TTIs on retail packages for a number of reasons, in particular because of their current limitations and because they are on the surface of packages and not inside the package, and because of their possible conflict with durability dates. However, TIs and TTIs may be used on the outside of cartons or pallets to detect temperature abuse during distribution from cold stores to holding stores at retail, and they can monitor transfer of quick frozen foods where monitoring records may not be available.',
  },
  unfitForConsumption: {
    title: 'Qatar Law No. 8 of 1990 · Art. 4 · Unfit food',
    url: LAW_8_1990,
    quote:
      'Food shall be deemed rotten, damaged or otherwise unsuitable for human consumption in the following cases:\n1. Where chemical or microbial analysis proves a change in its composition or if its natural properties change in terms of taste, appearance or smell;\n2. Where the period of validity of use expires in accordance with the date fixed in the statement written on its information label;\n3. Where food or its packaging or containers include larva, worms, insects, waste or animal residuals;\n4. Where food is prepared, produced or stored in or by unsanitary situations or methods.',
  },
  postCustomsOversight: {
    title: 'Qatar Law No. 8 of 1990 · Art. 7 · Oversight after customs',
    url: LAW_8_1990,
    quote:
      'The Ministry of Public Health, the Ministry of Municipal Affairs and Agriculture and all of the municipalities within their geographic jurisdictions shall monitor imported food after its release from customs departments and its transportation into the country, as well as food produced locally, and inspect such food within the markets, commercial or industrial shops, similar public establishments and industrial facilities, regardless of their capital and number of staff, means of transport used for food transportation, stores, warehouses and their attached or subordinate squares. This is to ensure the application of the provisions of this Law and its executive resolutions and to control cases that violate such provisions.',
  },
  inspectorPowers: {
    title: 'Qatar Law No. 8 of 1990 · Art. 20 and 23 · Inspection, seizure, destruction',
    url: LAW_8_1990,
    quote:
      'Art. 20: The aforesaid officers in the preceding Article, each within their competency, may enter the transport means, shops, facilities and places subject to the provisions of this Law and its executive resolutions to ensure the implementation of such provisions. Such officers shall also have the right to demand and check all books and documents related to food and to examine, take samples, inspect and ensure that the food complies with the aforesaid provisions. When samples are taken, the specialised staff shall temporarily seize the suspected food from which those samples were taken […].\n\nArt. 23: In case of urgency, where the analysis proves that a sample is either harmful to human health, rotten, damaged, contaminated, or otherwise unsuitable for human consumption, debased or violates the specifications in a manner that is harmful to human health, the administrative authority […] shall take the necessary measures to destroy all or some of the food from which the sample is taken.',
  },
  dateLabelIntegrity: {
    title: 'QS 10050:2025 §4/3 and §4/4 · Date labels',
    url: QS_10050,
    quoteAr:
      '٤/٣/١ أن تكون محفورة، أو بارزة، أو نافرة، أو مطبوعة، أو مختومة بطريقة غير قابلة للإزالة أو التعديل على العبوات مباشرة.\n٤/٣/٣ ألا تكون مكتوبة أو مشار لها بخط اليد، وألا تكون مطبوعة على ملصقات قابلة للإزالة.\n٤/٣/٤ في جميع الأحوال لا يسمح بأي نوع من أنواع التعديل أو الإضافة أو التوضيح على تاريخ الإنتاج وتاريخ الانتهاء سواء بوضع ملصقات إضافية أو غيرها من الطرق.\n٤/٤ ألا يكون هناك أكثر من تاريخ إنتاج و/أو تاريخ انتهاء على العبوة الواحدة.',
    quote:
      '4/3/1 [Production and expiry dates must] be engraved, embossed, raised, printed or stamped directly on the pack in a way that cannot be removed or altered.\n4/3/3 They must not be handwritten or marked by hand, and must not be printed on removable stickers.\n4/3/4 In all cases, no alteration, addition or clarification of the production or expiry date is permitted, whether by adding extra stickers or by any other means.\n4/4 There must not be more than one production date and/or expiry date on a single pack.',
    translated: true,
  },
  pecktagPhGrades: {
    title: 'Miao et al. 2023 · PeckTag pH grades',
    summary: 'Fresh: pH 5.7-6.1 · Borderline: above 6.1 up to 6.8 · Spoiled: above 6.8. The pH square uses purple sweet potato anthocyanin in a PVA/riclin film.',
  },
  suspectThreshold: { title: 'PeckTag policy · 2 incidents in 14 days' },
  repeatOffenderThreshold: { title: 'PeckTag policy · repeat offender: 1 incident' },
  maxGpsDistanceKm: { title: 'PeckTag policy · 1 km GPS tolerance' },
  nearExpiryDays: { title: 'PeckTag policy · sell first within 3 days of expiry' },
  minReadConfidence: { title: 'PeckTag policy · strip photo clarity' },
  refreezingThawed: {
    title: 'MOPH guidance · Refreezing (news report)',
    url: 'http://thepeninsulaqatar.com/article/31/03/2026/ministry-of-public-health-issues-safety-guidelines-for-handling-raw-food-products',
    quote:
      'Frozen poultry, meat and seafood must be defrosted properly, either in the refrigerator or using a microwave. Refreezing defrosted items should be avoided to prevent contamination risks.',
  },
};
