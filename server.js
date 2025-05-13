require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.post("/create-checkout-session", async (req, res) => {
    try {
        const { category, packageType, packageName, hours, participants, totalPrice } = req.body;

        let productName;

        if (category === "Personal Coaching") {
            productName = `Coaching Session - ${participants} participant(s), ${hours} hour(s)`;
        } else if (category === "KVB") {
            productName = `${packageName} (${participants} participant(s), ${hours} hour(s))`;
        } else {
            return res.status(400).json({ error: "Invalid category" });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "bancontact"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: productName,
                        },
                        unit_amount: Math.round(totalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}`,
            cancel_url: `${process.env.FRONTEND_URL}`,

            // ✅ Require phone number via custom field
            custom_fields: [
                {
                    key: "phone",
                    label: {
                        type: "custom",
                        custom: "Telefoonnummer"
                    },
                    type: "text",
                    text: {
                        required: true
                    }
                }
            ],
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Default route to check if the server is running
app.get("/", (req, res) => {
    res.send("Stripe backend is running!");
});

// Start server (with proper port configuration for local development and Vercel)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
