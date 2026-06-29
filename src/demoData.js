export function generateDemoPlan(destInput, days, tripType) {
  const destLower = destInput.trim().toLowerCase();
  let destName = destInput;
  let weather = "";
  let activities = "";
  let risks = "";
  let priorities = "";
  let mustPack = [];
  let optionalItems = [];
  let skipItems = [];
  let warnings = [];

  // 1. Classification & context setting
  if (destLower.includes('paris') || destLower.includes('france') || destLower.includes('europe') || destLower.includes('london')) {
    destName = "Paris, France";
    weather = "Temperatures ranging from 15°C to 24°C with mild breeze and potential light rain.";
    activities = "Sightseeing, museum visits, walking tours, and local dining.";
    risks = "Active pickpocketing in tourist hotspots, foot fatigue, and sudden rain.";
    priorities = "Focus on walking comfort, security, light layers, and EU power compatibility.";
    
    mustPack = [
      ["Comfortable Walking Shoes", "Crucial for cobblestone streets and extensive walking.", 10, "High"],
      ["Anti-theft Crossbody Bag", "High risk of pickpockets on Metro and near Eiffel Tower.", 9, "High"],
      ["Travel Power Adapter (Type C/E)", "Vital for charging electronics in European outlets.", 10, "High"],
      ["Lightweight Rain Jacket", "Weather can be unpredictable with brief showers.", 8, "Medium"]
    ];
    optionalItems = [
      ["Sunglasses and Sunscreen", "Protection during sunny daytime outdoor tours.", 6],
      ["Travel Umbrella", "Backup for heavy downpours when sightseeing.", 5]
    ];
    skipItems = [
      ["Heavy Hiking Boots", "Totally unnecessary for flat city pavements."],
      ["Large Hair Dryer", "Hotels provide basic ones; saves significant luggage space."]
    ];
    warnings = [
      "Keep hands on bags in crowded areas, especially Metro Line 1 and major landmarks.",
      "Wear broken-in shoes; new shoes will cause blisters on cobblestones."
    ];
  } else if (destLower.includes('hawaii') || destLower.includes('honolulu') || destLower.includes('beach') || destLower.includes('bali')) {
    destName = "Honolulu, Hawaii";
    weather = "Warm and humid. Highs around 28°C-31°C, lows around 22°C. Strong UV index.";
    activities = "Swimming, sunbathing, snorkeling, and casual walks.";
    risks = "Severe sunburn, coral cuts, and dehydration.";
    priorities = "Prioritizing sun/UV protection, swimwear, and highly breathable clothing.";

    mustPack = [
      ["High-SPF Coral-Reef Safe Sunscreen", "Sun is intense and Hawaii law bans non-reef-safe chemicals.", 10, "High"],
      ["Polarized Sunglasses", "Reduces harsh water glare during ocean activities.", 8, "Medium"],
      ["Quick-Dry Microfiber Towel", "Highly portable and dries fast in humid conditions.", 8, "High"],
      ["Sandals/Flip-Flops", "Crucial for hot sand and casual resort walking.", 9, "High"]
    ];
    optionalItems = [
      ["Wide-Brimmed Sun Hat", "Additional UV protection for face and neck.", 7],
      ["Aloe Vera Gel", "Soothing relief in case of accidental sunburn.", 6]
    ];
    skipItems = [
      ["Heavy Denim Jeans", "Too hot and restrictive for Hawaii's high humidity."],
      ["Heavy Winter Jackets", "Tropical climate makes cold-weather gear obsolete."]
    ];
    warnings = [
      "Apply sunscreen every 2 hours; the Hawaiian sun burns skin extremely fast.",
      "Respect ocean currents; check warning flags before entering the water."
    ];
  } else if (destLower.includes('iceland') || destLower.includes('reykjavik') || destLower.includes('cold') || destLower.includes('mountain') || destLower.includes('swiss')) {
    destName = "Reykjavik, Iceland";
    weather = "Windy, wet, and cold. Temperatures between 2°C and 10°C. High wind-chill factor.";
    activities = "Glacier hiking, waterfalls, driving, and hot springs exploration.";
    risks = "Hypothermia from wet wind, slips on wet rocks, and sudden weather shifts.";
    priorities = "Prioritizing wind/waterproof outerwear, thermal base layers, and sturdy boots.";

    mustPack = [
      ["Waterproof Hiking Boots", "Essential for grip on volcanic gravel, ice, and wet paths.", 10, "High"],
      ["Wind & Waterproof Hardshell Jacket", "Absolute necessity to block arctic wind and rain.", 10, "High"],
      ["Thermal Base Layers (Merino Wool)", "Traps body heat and wicks moisture during hikes.", 9, "High"],
      ["Warm Gloves & Beanie", "Wind chill makes extremities cold quickly.", 8, "High"]
    ];
    optionalItems = [
      ["Microfiber Pack Towel", "Convenient for wild hot springs or change rooms.", 6],
      ["Thermos Flask", "Keeps coffee or tea warm during long outdoor road trips.", 7]
    ];
    skipItems = [
      ["Umbrella", "High winds in Iceland render umbrellas useless and break them."],
      ["High Heels / Formal Shoes", "Volcanic terrain and gravel paths make them hazardous."]
    ];
    warnings = [
      "Do not wear cotton as a base layer; use wool or synthetic thermal fabrics.",
      "Check road and weather conditions daily on SafeTravel.is before driving."
    ];
  } else {
    // General fallback (Tokyo / Urban style)
    destName = destInput || "Tokyo, Japan";
    weather = "Temperate climate. Average temperatures around 16°C to 22°C. Comfortable.";
    activities = "Transit commuting, walking, indoor meetings, and dining.";
    risks = "Sudden rain showers and cultural dress expectations.";
    priorities = "Prioritizing comfortable walking shoes, clean presentation, and travel essentials.";

    mustPack = [
      ["Comfortable Walking Shoes", "Necessary for extensive walking in city stations.", 9, "High"],
      ["Travel Power Adapter", "Ensure plug compatibility for local sockets.", 9, "High"],
      ["Pocket Wi-Fi / eSIM", "Crucial for navigating city transit maps.", 10, "High"],
      ["Travel Umbrella", "Handy for sudden city showers.", 7, "Medium"]
    ];
    optionalItems = [
      ["Portable Power Bank", "Keep devices charged during long sightseeing days.", 8],
      ["Comfortable Daypack", "Lightweight bag to hold essentials during excursions.", 7]
    ];
    skipItems = [
      ["Heavy Hiking Gear", "Unnecessary for metropolitan environment."],
      ["Excessive Cash", "Most places accept credit cards or digital transit passes."]
    ];
    warnings = [
      "Keep to the designated walking side on escalators to respect local flow.",
      "Carry a small bag for your trash, as public garbage cans are rare."
    ];
  }

  // 2. Adjustments based on Trip Type
  let tripTypeDesc = "";
  if (tripType === "Business") {
    tripTypeDesc = "business trip. Focus on professional meetings, presentations, and formal dining.";
    mustPack.unshift(["Professional Suit / Blazer", "Essential for formal meetings and professional environments.", 10, "High"]);
    mustPack.push(["Notebook & Pen", "Handy for recording notes in professional sessions.", 8, "High"]);
    optionalItems.push(["Portable Steamer", "Ensures business attire remains wrinkle-free.", 6]);
    skipItems.push(["Casual Lounge Shorts", "Inappropriate for corporate settings."]);
    warnings.push("Dress conservatively; corporate expectations are highly formal.");
  } else if (tripType === "Beach") {
    tripTypeDesc = "beach holiday. Focus on swimming, coastal relaxation, and light sun exposure.";
    mustPack.unshift(["Swimwear", "Essential for beach and swimming pool activities.", 10, "High"]);
    optionalItems.push(["Beach Cover-up / Sarong", "Useful when walking to and from the beach.", 7]);
    skipItems.push(["Formal Suit / Tie", "Completely unnecessary for a relaxed beach environment."]);
    warnings.push("Ensure your sunscreen is reef-safe to protect local marine ecology.");
  } else if (tripType === "Adventure") {
    tripTypeDesc = "outdoor adventure. Focus on high-exertion hikes, nature exploration, and trail activities.";
    mustPack.unshift(["Sturdy Trail Footwear", "Required for safety and grip on rugged outdoor trails.", 10, "High"]);
    mustPack.push(["First Aid Kit (Blister Pack)", "Necessary for trail emergencies and foot protection.", 9, "High"]);
    optionalItems.push(["Energy Bars & Snacks", "Quick fuel during long physical excursions.", 7]);
    skipItems.push(["Bulky Electronics", "Reduces pack weight and avoids damage risks."]);
    warnings.push("Always let someone know your trail route and check weather reports.");
  } else {
    // Leisure
    tripTypeDesc = "leisure vacation. Focus on general sightseeing, shopping, and casual exploring.";
    mustPack.unshift(["Comfortable Day Wear", "Lightweight clothing suitable for casual sightseeing.", 9, "High"]);
    optionalItems.push(["Local Guidebook / Map App", "Helps navigate city sights and dining options.", 6]);
    skipItems.push(["Formal Presentation Materials", "Not needed for a relaxing leisure vacation."]);
  }

  // 3. Clothing scaling based on Days
  let underwearDisplay = `${days}x Sets of Underwear`;
  let socksDisplay = `${days}x Pairs of Socks`;
  let underwearReason = "Sufficient clean changes for the trip duration.";
  let socksReason = "Keeps feet clean and dry daily.";

  if (days > 7) {
    underwearDisplay = "7x to 10x Sets of Underwear";
    socksDisplay = "7x to 10x Pairs of Socks";
    underwearReason = "(Assuming weekly laundry cycles for long-duration stays to optimize luggage weight)";
    socksReason = "(Assuming weekly laundry cycles for long-duration stays to optimize luggage weight)";
  }

  const shirtsCount = Math.min(days, 8);
  const pantsCount = Math.max(1, Math.min(Math.ceil(days / 2.5), 4));

  mustPack.push([underwearDisplay, underwearReason, 9, "High"]);
  mustPack.push([socksDisplay, socksReason, 9, "High"]);
  mustPack.push([`${shirtsCount}x Packable Shirts`, "Dynamic selection for daily clothing changes.", 8, "High"]);
  mustPack.push([`${pantsCount}x Versatile Pants / Bottoms`, "Reusable pants that go with multiple shirts.", 8, "High"]);

  // 4. Build output string strictly matching format
  const output = `Thinking Steps:
[Analyzing destination: ${destName}. Target area with unique regional logistics.]
[Estimating weather: ${weather}]
[Understanding trip type: ${days}-day ${tripTypeDesc}]
[Inferring activities: ${activities}]
[Detecting risks: ${risks}]
[Prioritizing items: ${priorities}]

Final Plan:

Must Pack:
${mustPack.map(item => `- ${item[0]} | ${item[1]} | ${item[2]} | ${item[3]}`).join('\n')}

Optional Items:
${optionalItems.map(item => `- ${item[0]} | ${item[1]} | ${item[2]}`).join('\n')}

Skip Items:
${skipItems.map(item => `- ${item[0]} | ${item[1]}`).join('\n')}

Warnings:
${warnings.map(w => `- ${w}`).join('\n')}
`;

  return output;
}
