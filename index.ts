import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set in environment variables.");
  console.error("Please create a .env file with: OPENAI_API_KEY=your_key_here");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PersonalityRequest {
  items: string[]; // Array of item names
}

const PersonalityResponseSchema = z.object({
  personalityType: z.enum([
    "farmers-market-poet",
    "aesthetic-nourisher",
    "balanced-overthinker",
    "caffeinated-visionary",
    "chaos-chef",
    "chill-gut-guru",
    "cozy-carb-collector",
    "culinary-maximalist",
    "cultural-collector",
    "fridge-curator",
    "green-alchemist",
    "indulgent-existenilist",
    "label-philosopher",
    "minimalist-forager",
    "snack-theorist",
    "time-traveler",
  ]),
  description: z.string().max(200, "Description must be 200 characters or less"),
});

type PersonalityResponse = z.infer<typeof PersonalityResponseSchema>;

app.post("/api/personality", async (req, res) => {
  try {
    const { items }: PersonalityRequest = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length !== 10) {
      return res.status(400).json({
        error: "Please provide exactly 10 items in an array",
      });
    }

    // Create prompt for OpenAI
    const itemList = items.map((item, index) => `${index + 1}. ${item}`).join("\n");

    const prompt = `Based on these 10 grocery items, select the most appropriate personality type and create a description:

${itemList}

Analyze the items for specific themes, patterns, or characteristics. ALWAYS look for a pattern first before considering maximalist/chaos types. Look for:
- Gut health focus (kombucha, skyr, sheep-s-milk-yogurt, yogurt, drinkable-yogurt, pickled-garlic, fermented-chili-bean-paste, kimchi-style items) → chill-gut-guru
- Aesthetic or presentation focus (microgreens, purple-yam, red-and-golden-apples, white-apple, bell-peppers, oyster-mushrooms, blueberries, strawberries, grapes, kale, spinach, colorful produce) → aesthetic-nourisher, farmers-market-poet
- Convenience or time-saving (canned-beans, canned-corn, canned-tuna, canned-spam, canned-octopus, mac-and-cheese, french-fries, hot-dogs, cheeseburgers, pizza, carrot-soup, mixed-frozen-vegetables, diced-tomatoes, cooked-shrimp, pre-made items, ready-to-eat foods) → snack-theorist, time-traveler
- Minimalism or simplicity (salt-and-pepper, white-rice, eggs, bread, white-bread, butter, basic vegetables like carrots, potatoes, yellow-onions, celery, simple staples) → minimalist-forager
- Label reading or ingredient awareness (tempeh, tofu, almond-milk, sesame-tahini, specialty items, alternative products) → label-philosopher
- Comfort foods (bread, bread-rolls, dinner-rolls, english-muffins, waffles, pancake-mix, oatmeal, mac-and-cheese, mashed-potatoes-style items, warm breakfast items) → cozy-carb-collector
- Indulgence or treats (mochi-ice-cream, whipped-cream, jello, potato-chips, wasabi-peas, elderflower-soda, ice-cream, chocolate-cake, cupcakes, egg-tarts, mille-cake, sweet treats, soda-can, aloe-vera-drink, orange-juice) → indulgent-existenilist
- Organization or planning (meal prep items like chicken, salmon-fillets, pork-chops, sliced-turkey, curated selection, ingredients for specific recipes, cooking-oil, tomato-sauce, pasta-variety-pack) → fridge-curator
- Caffeine focus (black-coffee, nitro-cold-brew, iced-tea, herbal-tea, coffee-related items) → caffeinated-visionary
- Evidence of analysis paralysis or overthinking (only use balanced-overthinker if items show clear signs of overthinking/indecision)
- Very strong alternative health focus (multiple superfoods, supplements, alternative health products) → green-alchemist (ONLY use if there's a clear alternative/wellness product focus, not just healthy items)
- Strong cultural diversity with multiple distinct cultural items (naan, soba-noodles, taro-buns, plantains, fermented-chili-bean-paste, chili-crisp, black-vinegar, umami-seasoning, spring-rolls, tortillas, soy-sauce, halloumi-cheese, couscous, sardines-in-mustard-sauce) → cultural-collector (ONLY use if there are MULTIPLE items from DIFFERENT cultures/regions, not just one or two cultural items)
- ONLY as last resort: Extreme variety with ABSOLUTELY NO discernible pattern, theme, or connection → culinary-maximalist or chaos-chef (ONLY use if you've exhausted all other options and truly cannot find ANY pattern)

CRITICAL: Avoid defaulting to "culinary-maximalist" or "chaos-chef". These should be rare exceptions. Most carts have SOME pattern - look harder! Even mixed items usually have a theme (comfort foods, convenience, cultural fusion, etc.). Only use maximalist/chaos if there is genuinely NO pattern after careful analysis. Avoid defaulting to "cultural-collector" - only use if there are MULTIPLE items from DIFFERENT cultures/regions, not just one or two cultural items. Avoid defaulting to "green-alchemist" just because items are healthy. Avoid defaulting to "balanced-overthinker" unless there's clear evidence of analysis paralysis. Prioritize more specific and distinctive personality types that match clear patterns in the items.

IMPORTANT: While the items should inform your choice, add some creative variety. If multiple personality types could reasonably fit, don't always pick the most obvious one - sometimes choose a less obvious but still valid interpretation. This adds delightful surprise and keeps results interesting. The personality should feel authentic to the items but doesn't need to be the most literal match.

Write the description as a personality test result, starting with "You are a..." or "You are the..." Make it playful, insightful, and slightly dramatic. The personality should feel authentic to the items chosen. IMPORTANT: Reference at least 2-3 specific items from the list above in your description. Do NOT mention the personality type name in the description - describe the traits and characteristics instead. The description must be 200 characters or less.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content:
            "You are a creative personality analyst who creates fun, witty grocery shopping personalities. Analyze the grocery items for specific themes, patterns, or characteristics. ALWAYS look for a pattern first - most carts have SOME theme (comfort foods, convenience, cultural fusion, aesthetic choices, etc.). Only use 'culinary-maximalist' or 'chaos-chef' as a last resort if there is ABSOLUTELY NO discernible pattern after careful analysis. These should be rare exceptions. Avoid defaulting to 'cultural-collector' - only use if there are MULTIPLE items from DIFFERENT cultures/regions, not just one or two cultural items. While items should inform your choice, add creative variety - if multiple personality types could reasonably fit, don't always pick the most obvious one. Sometimes choose a less obvious but still valid interpretation to add delightful surprise. Avoid defaulting to 'green-alchemist' just because items are healthy - only use it for clear alternative health/wellness product focus (superfoods, supplements). Avoid defaulting to 'balanced-overthinker' unless there's clear evidence of analysis paralysis. Consider all personality types: aesthetic choices, convenience needs, minimalism, label awareness, comfort foods, indulgence, organization, caffeine focus, gut health focus. Select a personality type that feels authentic to the items but doesn't need to be the most literal match. Format descriptions as personality test results (e.g., 'You are a...' or 'You are the...'). Always reference at least 2-3 specific items from the user's cart in your description. Do NOT mention the personality type name in the description - describe the traits, behaviors, and characteristics instead. Keep descriptions under 200 characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: zodResponseFormat(PersonalityResponseSchema, "personality"),
      temperature: 1.0,
    });

    // Parse the response content and validate with Zod schema
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const jsonContent = JSON.parse(content);
    const result = PersonalityResponseSchema.parse(jsonContent);

    res.json(result);
  } catch (error) {
    console.error("Error generating personality:", error);
    res.status(500).json({
      error: "Failed to generate personality. Please try again.",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
