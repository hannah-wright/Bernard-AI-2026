-- Insert additional early-stage high-growth startups
INSERT INTO startups (id, name, description, eli5, website, sectors, city, state, country, estimated_revenue, estimated_size, buzz_score, created_at) VALUES
-- AI/ML Startups
(gen_random_uuid(), 'Runway ML', 'AI-powered creative tools for video generation and editing using multimodal foundation models.', 'Makes AI that can create and edit videos like magic - you describe what you want and it makes it.', 'https://runwayml.com', ARRAY['AI/ML']::sector_type[], 'New York', 'NY', 'United States', '$10M-$50M', '51-200', 92, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'Anthropic', 'AI safety company building reliable, interpretable AI systems with constitutional AI approach.', 'Building AI assistants that are helpful and safe, teaching AI to follow rules and be honest.', 'https://anthropic.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '201-500', 98, NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'Cohere', 'Enterprise-grade large language models for natural language understanding and generation.', 'Makes AI that helps businesses understand and write text automatically.', 'https://cohere.ai', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'Toronto', NULL, 'Canada', '$10M-$50M', '101-200', 88, NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'Mistral AI', 'Open-source large language models competing with proprietary AI systems.', 'French startup making powerful AI models that anyone can use and customize.', 'https://mistral.ai', ARRAY['AI/ML']::sector_type[], 'Paris', NULL, 'France', '$10M-$50M', '51-100', 95, NOW() - INTERVAL '4 days'),
(gen_random_uuid(), 'Inflection AI', 'Personal AI assistant focused on emotional intelligence and natural conversation.', 'Building a friendly AI companion that can chat naturally and remember your preferences.', 'https://inflection.ai', ARRAY['AI/ML', 'Consumer']::sector_type[], 'Palo Alto', 'CA', 'United States', '$50M-$100M', '101-200', 90, NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'Adept AI', 'Building AI that can use software tools and complete complex workflows autonomously.', 'AI that can actually use computers like humans - clicking, typing, and getting work done.', 'https://adept.ai', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 87, NOW() - INTERVAL '6 days'),
(gen_random_uuid(), 'Character.AI', 'Platform for creating and chatting with AI characters with distinct personalities.', 'Create your own AI friends with unique personalities to chat and roleplay with.', 'https://character.ai', ARRAY['AI/ML', 'Consumer']::sector_type[], 'Menlo Park', 'CA', 'United States', '$10M-$50M', '51-100', 89, NOW() - INTERVAL '7 days'),
(gen_random_uuid(), 'Jasper AI', 'AI content generation platform for marketing teams and content creators.', 'Helps marketers write ads, blogs, and social posts using AI that knows your brand voice.', 'https://jasper.ai', ARRAY['AI/ML', 'SaaS']::sector_type[], 'Austin', 'TX', 'United States', '$50M-$100M', '201-500', 84, NOW() - INTERVAL '8 days'),
(gen_random_uuid(), 'Stability AI', 'Open-source generative AI company behind Stable Diffusion image generation.', 'Makes AI that creates images from text descriptions - type what you want to see.', 'https://stability.ai', ARRAY['AI/ML']::sector_type[], 'London', NULL, 'United Kingdom', '$50M-$100M', '101-200', 91, NOW() - INTERVAL '9 days'),
(gen_random_uuid(), 'Hugging Face', 'Open-source platform for sharing and deploying machine learning models.', 'Like GitHub but for AI models - share, find, and use AI easily.', 'https://huggingface.co', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'New York', 'NY', 'United States', '$50M-$100M', '101-200', 93, NOW() - INTERVAL '10 days'),

-- Fintech Startups
(gen_random_uuid(), 'Ramp', 'Corporate card and spend management platform with automated expense tracking.', 'Company credit cards that automatically track spending and find ways to save money.', 'https://ramp.com', ARRAY['Fintech', 'SaaS']::sector_type[], 'New York', 'NY', 'United States', '$100M+', '501-1000', 94, NOW() - INTERVAL '11 days'),
(gen_random_uuid(), 'Mercury', 'Banking for startups with modern tools for financial operations.', 'A bank built just for startups with easy online tools and no annoying fees.', 'https://mercury.com', ARRAY['Fintech']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 91, NOW() - INTERVAL '12 days'),
(gen_random_uuid(), 'Brex', 'Financial operating system for growing companies with corporate cards and cash management.', 'All-in-one money management for businesses - cards, banking, and expense tracking.', 'https://brex.com', ARRAY['Fintech', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 89, NOW() - INTERVAL '13 days'),
(gen_random_uuid(), 'Deel', 'Global payroll and compliance platform for hiring international workers.', 'Pay employees anywhere in the world without worrying about local laws and taxes.', 'https://deel.com', ARRAY['Fintech', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 92, NOW() - INTERVAL '14 days'),
(gen_random_uuid(), 'Pipe', 'Trading platform that lets companies trade recurring revenue for upfront capital.', 'Turn your monthly subscriptions into cash now without giving up equity.', 'https://pipe.com', ARRAY['Fintech']::sector_type[], 'Miami', 'FL', 'United States', '$10M-$50M', '101-200', 83, NOW() - INTERVAL '15 days'),
(gen_random_uuid(), 'Carta', 'Equity management platform for private companies and their employees.', 'Helps companies manage who owns what shares and handles all the paperwork.', 'https://carta.com', ARRAY['Fintech', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 88, NOW() - INTERVAL '16 days'),
(gen_random_uuid(), 'Varo', 'Mobile-first digital bank offering checking, savings, and credit products.', 'A real bank that lives in your phone with no monthly fees or minimum balance.', 'https://varomoney.com', ARRAY['Fintech', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '501-1000', 81, NOW() - INTERVAL '17 days'),
(gen_random_uuid(), 'Plaid', 'Financial data network connecting apps to users bank accounts securely.', 'The pipes that let apps safely connect to your bank to see transactions.', 'https://plaid.com', ARRAY['Fintech', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 90, NOW() - INTERVAL '18 days'),
(gen_random_uuid(), 'Revolut', 'Global financial super app with banking, crypto, and international transfers.', 'One app for all your money needs - spend, save, invest, and send money worldwide.', 'https://revolut.com', ARRAY['Fintech', 'Consumer']::sector_type[], 'London', NULL, 'United Kingdom', '$100M+', '5001+', 93, NOW() - INTERVAL '19 days'),
(gen_random_uuid(), 'Stripe Atlas', 'Platform helping entrepreneurs incorporate companies and start businesses globally.', 'Start a real US company from anywhere in the world in just a few clicks.', 'https://stripe.com/atlas', ARRAY['Fintech', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '5001+', 95, NOW() - INTERVAL '20 days'),

-- Healthcare/Biotech Startups
(gen_random_uuid(), 'Tempus', 'AI-powered precision medicine platform analyzing clinical and molecular data.', 'Uses AI to help doctors pick the best cancer treatments based on your genes.', 'https://tempus.com', ARRAY['Healthcare', 'AI/ML']::sector_type[], 'Chicago', 'IL', 'United States', '$100M+', '1001-5000', 89, NOW() - INTERVAL '21 days'),
(gen_random_uuid(), 'Cerebral', 'Online mental health platform providing therapy and medication management.', 'See a therapist or psychiatrist from your couch through video calls.', 'https://cerebral.com', ARRAY['Healthcare', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '501-1000', 78, NOW() - INTERVAL '22 days'),
(gen_random_uuid(), 'Ro', 'Digital health clinic offering telehealth and pharmacy services.', 'Get prescriptions and talk to doctors online without leaving home.', 'https://ro.co', ARRAY['Healthcare', 'Consumer']::sector_type[], 'New York', 'NY', 'United States', '$100M+', '501-1000', 85, NOW() - INTERVAL '23 days'),
(gen_random_uuid(), 'Hims & Hers', 'Telehealth platform for personalized health and wellness products.', 'Online doctors for hair loss, skincare, and other personal health stuff.', 'https://forhims.com', ARRAY['Healthcare', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 84, NOW() - INTERVAL '24 days'),
(gen_random_uuid(), 'Komodo Health', 'Healthcare analytics platform using real-world patient data.', 'Tracks how diseases spread and treatments work using billions of health records.', 'https://komodohealth.com', ARRAY['Healthcare', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 82, NOW() - INTERVAL '25 days'),
(gen_random_uuid(), 'Verily', 'Life sciences company applying tech to improve health outcomes.', 'Google''s health company building tech to understand and improve our bodies.', 'https://verily.com', ARRAY['Healthcare', 'Biotech']::sector_type[], 'South San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 87, NOW() - INTERVAL '26 days'),
(gen_random_uuid(), 'Devoted Health', 'Medicare Advantage insurer using technology to improve senior healthcare.', 'Health insurance for seniors that actually helps you navigate the system.', 'https://devoted.com', ARRAY['Healthcare']::sector_type[], 'Waltham', 'MA', 'United States', '$100M+', '1001-5000', 83, NOW() - INTERVAL '27 days'),
(gen_random_uuid(), 'Recursion', 'Biotech using AI and automation to discover new drugs faster.', 'Robots and AI working together to find new medicines at superhuman speed.', 'https://recursion.com', ARRAY['Biotech', 'AI/ML']::sector_type[], 'Salt Lake City', 'UT', 'United States', '$50M-$100M', '501-1000', 86, NOW() - INTERVAL '28 days'),
(gen_random_uuid(), 'Insitro', 'Machine learning-driven drug discovery company.', 'Using AI to figure out which drugs will work before expensive human trials.', 'https://insitro.com', ARRAY['Biotech', 'AI/ML']::sector_type[], 'South San Francisco', 'CA', 'United States', '$10M-$50M', '101-200', 84, NOW() - INTERVAL '29 days'),
(gen_random_uuid(), 'Ginkgo Bioworks', 'Organism engineering company designing custom microbes for various industries.', 'Programs tiny organisms like yeast to make medicines, food ingredients, and materials.', 'https://ginkgobioworks.com', ARRAY['Biotech']::sector_type[], 'Boston', 'MA', 'United States', '$100M+', '501-1000', 88, NOW() - INTERVAL '30 days'),

-- SaaS/Enterprise Startups
(gen_random_uuid(), 'Notion', 'All-in-one workspace for notes, docs, wikis, and project management.', 'One app to replace all your work apps - notes, tasks, wikis, databases.', 'https://notion.so', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '201-500', 94, NOW() - INTERVAL '31 days'),
(gen_random_uuid(), 'Figma', 'Collaborative interface design tool for teams.', 'Design websites and apps together in real-time, like Google Docs for design.', 'https://figma.com', ARRAY['SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 96, NOW() - INTERVAL '32 days'),
(gen_random_uuid(), 'Linear', 'Issue tracking and project management for software teams.', 'Beautiful, fast task management that developers actually want to use.', 'https://linear.app', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 91, NOW() - INTERVAL '33 days'),
(gen_random_uuid(), 'Retool', 'Low-code platform for building internal business tools.', 'Drag and drop to build admin panels and dashboards without coding.', 'https://retool.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 88, NOW() - INTERVAL '34 days'),
(gen_random_uuid(), 'Vercel', 'Frontend cloud platform for deploying web applications.', 'Put your website online in seconds with automatic scaling and global CDN.', 'https://vercel.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 93, NOW() - INTERVAL '35 days'),
(gen_random_uuid(), 'Supabase', 'Open-source Firebase alternative with PostgreSQL database.', 'All the backend stuff - database, auth, storage - ready to use in minutes.', 'https://supabase.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '101-200', 92, NOW() - INTERVAL '36 days'),
(gen_random_uuid(), 'Railway', 'Infrastructure platform for deploying applications instantly.', 'Deploy your app to the cloud by just connecting your GitHub repo.', 'https://railway.app', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$1M-$10M', '11-50', 85, NOW() - INTERVAL '37 days'),
(gen_random_uuid(), 'Render', 'Unified cloud platform to build and run apps and websites.', 'Simple cloud hosting that just works - deploy code, get a URL.', 'https://render.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 86, NOW() - INTERVAL '38 days'),
(gen_random_uuid(), 'Airtable', 'Spreadsheet-database hybrid for building collaborative apps.', 'Spreadsheets with superpowers - build custom apps without coding.', 'https://airtable.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 89, NOW() - INTERVAL '39 days'),
(gen_random_uuid(), 'Webflow', 'Visual web development platform for building professional websites.', 'Design beautiful websites visually without writing code.', 'https://webflow.com', ARRAY['SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 90, NOW() - INTERVAL '40 days'),

-- Climate Tech Startups
(gen_random_uuid(), 'Watershed', 'Enterprise climate platform for measuring and reducing carbon footprint.', 'Helps big companies figure out their carbon emissions and how to reduce them.', 'https://watershed.com', ARRAY['Climate Tech', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '101-200', 87, NOW() - INTERVAL '41 days'),
(gen_random_uuid(), 'Pachama', 'Forest carbon credit verification using satellite imagery and AI.', 'Uses satellites to make sure forest carbon credits are actually saving trees.', 'https://pachama.com', ARRAY['Climate Tech', 'AI/ML']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 84, NOW() - INTERVAL '42 days'),
(gen_random_uuid(), 'Charm Industrial', 'Converting biomass into bio-oil for permanent carbon removal.', 'Turns farm waste into oil and pumps it underground to trap carbon forever.', 'https://charmindustrial.com', ARRAY['Climate Tech']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 82, NOW() - INTERVAL '43 days'),
(gen_random_uuid(), 'Commonwealth Fusion', 'Developing compact fusion reactors for limitless clean energy.', 'Building tiny fusion reactors - the same energy source as the sun.', 'https://cfs.energy', ARRAY['Climate Tech']::sector_type[], 'Cambridge', 'MA', 'United States', '$50M-$100M', '201-500', 91, NOW() - INTERVAL '44 days'),
(gen_random_uuid(), 'Twelve', 'Converting CO2 into chemicals and materials using electrochemistry.', 'Turns pollution from the air into useful stuff like jet fuel and plastics.', 'https://twelve.co', ARRAY['Climate Tech']::sector_type[], 'Berkeley', 'CA', 'United States', '$10M-$50M', '51-100', 85, NOW() - INTERVAL '45 days'),
(gen_random_uuid(), 'Form Energy', 'Multi-day energy storage using iron-air batteries.', 'Giant batteries made of rust that can store wind and solar power for days.', 'https://formenergy.com', ARRAY['Climate Tech']::sector_type[], 'Somerville', 'MA', 'United States', '$50M-$100M', '201-500', 89, NOW() - INTERVAL '46 days'),
(gen_random_uuid(), 'Climeworks', 'Direct air capture technology removing CO2 from the atmosphere.', 'Giant vacuum cleaners that suck carbon dioxide out of the air.', 'https://climeworks.com', ARRAY['Climate Tech']::sector_type[], 'Zurich', NULL, 'Switzerland', '$50M-$100M', '201-500', 90, NOW() - INTERVAL '47 days'),
(gen_random_uuid(), 'Redwood Materials', 'Recycling lithium-ion batteries to recover critical materials.', 'Takes old EV batteries apart and recovers the valuable metals inside.', 'https://redwoodmaterials.com', ARRAY['Climate Tech']::sector_type[], 'Carson City', 'NV', 'United States', '$100M+', '501-1000', 92, NOW() - INTERVAL '48 days'),
(gen_random_uuid(), 'Northvolt', 'European battery manufacturer for electric vehicles.', 'Building huge battery factories in Europe to power electric cars.', 'https://northvolt.com', ARRAY['Climate Tech']::sector_type[], 'Stockholm', NULL, 'Sweden', '$100M+', '1001-5000', 88, NOW() - INTERVAL '49 days'),
(gen_random_uuid(), 'QuantumScape', 'Solid-state battery technology for electric vehicles.', 'Next-gen batteries that charge faster, last longer, and are safer.', 'https://quantumscape.com', ARRAY['Climate Tech']::sector_type[], 'San Jose', 'CA', 'United States', '$50M-$100M', '501-1000', 86, NOW() - INTERVAL '50 days'),

-- E-commerce Startups
(gen_random_uuid(), 'Faire', 'B2B wholesale marketplace connecting retailers with brands.', 'Like a giant wholesale market online where small shops can find cool products.', 'https://faire.com', ARRAY['E-commerce', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 88, NOW() - INTERVAL '51 days'),
(gen_random_uuid(), 'Bolt', 'One-click checkout platform for e-commerce stores.', 'Remembers your payment info so you can buy stuff with one click anywhere.', 'https://bolt.com', ARRAY['E-commerce', 'Fintech']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 79, NOW() - INTERVAL '52 days'),
(gen_random_uuid(), 'Shopify Shop', 'Consumer shopping app connecting buyers with Shopify merchants.', 'One app to track all your online orders and discover new stores.', 'https://shop.app', ARRAY['E-commerce', 'Consumer']::sector_type[], 'Ottawa', NULL, 'Canada', '$100M+', '5001+', 91, NOW() - INTERVAL '53 days'),
(gen_random_uuid(), 'Whatnot', 'Live shopping platform for collectibles and unique items.', 'Watch live streams where people sell Pokemon cards, sneakers, and collectibles.', 'https://whatnot.com', ARRAY['E-commerce', 'Consumer']::sector_type[], 'Los Angeles', 'CA', 'United States', '$50M-$100M', '201-500', 87, NOW() - INTERVAL '54 days'),
(gen_random_uuid(), 'Veho', 'Next-day delivery network for e-commerce packages.', 'Delivers your online orders faster with better tracking and customer service.', 'https://shipveho.com', ARRAY['E-commerce']::sector_type[], 'Boulder', 'CO', 'United States', '$50M-$100M', '1001-5000', 83, NOW() - INTERVAL '55 days'),
(gen_random_uuid(), 'Flexport', 'Digital freight forwarder and supply chain platform.', 'Makes shipping stuff around the world as easy as booking a flight.', 'https://flexport.com', ARRAY['E-commerce', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 86, NOW() - INTERVAL '56 days'),
(gen_random_uuid(), 'Thrasio', 'Acquirer and operator of Amazon third-party seller brands.', 'Buys successful Amazon shops and makes them even bigger.', 'https://thrasio.com', ARRAY['E-commerce']::sector_type[], 'Walpole', 'MA', 'United States', '$100M+', '501-1000', 75, NOW() - INTERVAL '57 days'),
(gen_random_uuid(), 'Meesho', 'Social commerce platform for small businesses in India.', 'Lets anyone in India start selling products through WhatsApp and social media.', 'https://meesho.com', ARRAY['E-commerce', 'Consumer']::sector_type[], 'Bangalore', NULL, 'India', '$100M+', '1001-5000', 89, NOW() - INTERVAL '58 days'),
(gen_random_uuid(), 'Rappi', 'On-demand delivery super app for Latin America.', 'Get anything delivered - food, groceries, medicine, cash - in minutes.', 'https://rappi.com', ARRAY['E-commerce', 'Consumer']::sector_type[], 'Bogota', NULL, 'Colombia', '$100M+', '1001-5000', 85, NOW() - INTERVAL '59 days'),
(gen_random_uuid(), 'Grab', 'Southeast Asian super app for rides, delivery, and payments.', 'One app for everything in Southeast Asia - rides, food, payments, and more.', 'https://grab.com', ARRAY['E-commerce', 'Fintech']::sector_type[], 'Singapore', NULL, 'Singapore', '$100M+', '5001+', 91, NOW() - INTERVAL '60 days'),

-- More AI/ML Early Stage
(gen_random_uuid(), 'Perplexity AI', 'AI-powered search engine with cited answers.', 'Google but it actually answers your questions and shows you where it got the info.', 'https://perplexity.ai', ARRAY['AI/ML', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 94, NOW() - INTERVAL '61 days'),
(gen_random_uuid(), 'Pika Labs', 'AI video generation from text and images.', 'Type what you want and watch AI create videos from scratch.', 'https://pika.art', ARRAY['AI/ML']::sector_type[], 'Palo Alto', 'CA', 'United States', '$1M-$10M', '11-50', 89, NOW() - INTERVAL '62 days'),
(gen_random_uuid(), 'ElevenLabs', 'AI voice synthesis and cloning platform.', 'Clone any voice and make it say anything - for audiobooks, games, and more.', 'https://elevenlabs.io', ARRAY['AI/ML', 'SaaS']::sector_type[], 'New York', 'NY', 'United States', '$10M-$50M', '51-100', 93, NOW() - INTERVAL '63 days'),
(gen_random_uuid(), 'Midjourney', 'AI image generation through Discord bot interface.', 'Type descriptions and get stunning AI artwork in seconds.', 'https://midjourney.com', ARRAY['AI/ML', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '11-50', 96, NOW() - INTERVAL '64 days'),
(gen_random_uuid(), 'Synthesia', 'AI video generation with virtual presenters.', 'Create training videos with AI avatars that speak any language.', 'https://synthesia.io', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'London', NULL, 'United Kingdom', '$10M-$50M', '101-200', 87, NOW() - INTERVAL '65 days'),
(gen_random_uuid(), 'Descript', 'AI-powered audio and video editing through text editing.', 'Edit podcasts and videos by editing the transcript like a Word document.', 'https://descript.com', ARRAY['AI/ML', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '101-200', 86, NOW() - INTERVAL '66 days'),
(gen_random_uuid(), 'Glean', 'Enterprise AI search across all company apps and documents.', 'Search everything at work - Slack, Google Drive, email - all at once.', 'https://glean.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'Palo Alto', 'CA', 'United States', '$50M-$100M', '201-500', 88, NOW() - INTERVAL '67 days'),
(gen_random_uuid(), 'Harvey AI', 'AI legal assistant for law firms and legal departments.', 'ChatGPT but trained specifically to help lawyers do legal research.', 'https://harvey.ai', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '51-100', 91, NOW() - INTERVAL '68 days'),
(gen_random_uuid(), 'Writer', 'Enterprise-grade generative AI for content creation.', 'AI writing assistant that learns your companys style and brand voice.', 'https://writer.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$10M-$50M', '101-200', 85, NOW() - INTERVAL '69 days'),
(gen_random_uuid(), 'Copy.ai', 'AI copywriting tool for marketing and sales content.', 'Generate marketing copy, emails, and ads with AI in seconds.', 'https://copy.ai', ARRAY['AI/ML', 'SaaS']::sector_type[], 'Memphis', 'TN', 'United States', '$10M-$50M', '51-100', 82, NOW() - INTERVAL '70 days'),

-- More Enterprise/SaaS
(gen_random_uuid(), 'Rippling', 'All-in-one HR, IT, and finance platform for businesses.', 'One place to manage employees - payroll, benefits, laptops, software access.', 'https://rippling.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 93, NOW() - INTERVAL '71 days'),
(gen_random_uuid(), 'Gusto', 'Payroll, benefits, and HR platform for small businesses.', 'Easy payroll and benefits for small businesses - run it all yourself.', 'https://gusto.com', ARRAY['SaaS', 'Fintech']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 88, NOW() - INTERVAL '72 days'),
(gen_random_uuid(), 'Lattice', 'People management platform for performance and engagement.', 'Tools for managers to do performance reviews and keep employees happy.', 'https://lattice.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 84, NOW() - INTERVAL '73 days'),
(gen_random_uuid(), 'Gong', 'Revenue intelligence platform analyzing sales conversations.', 'Records sales calls and tells you what winners do differently.', 'https://gong.io', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 89, NOW() - INTERVAL '74 days'),
(gen_random_uuid(), 'Calendly', 'Scheduling automation platform for meetings.', 'Share a link and let people book time on your calendar without back-and-forth.', 'https://calendly.com', ARRAY['SaaS']::sector_type[], 'Atlanta', 'GA', 'United States', '$100M+', '501-1000', 87, NOW() - INTERVAL '75 days'),
(gen_random_uuid(), 'Loom', 'Async video messaging for workplace communication.', 'Record quick videos to explain things instead of typing long emails.', 'https://loom.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 86, NOW() - INTERVAL '76 days'),
(gen_random_uuid(), 'Miro', 'Online collaborative whiteboard platform.', 'Giant digital whiteboard where teams can brainstorm together from anywhere.', 'https://miro.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '1001-5000', 90, NOW() - INTERVAL '77 days'),
(gen_random_uuid(), 'Monday.com', 'Work operating system for project and workflow management.', 'Colorful boards to track projects and tasks that teams actually enjoy using.', 'https://monday.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'Tel Aviv', NULL, 'Israel', '$100M+', '1001-5000', 88, NOW() - INTERVAL '78 days'),
(gen_random_uuid(), 'ClickUp', 'All-in-one productivity platform replacing multiple work tools.', 'One app for tasks, docs, goals, and chat - replace your whole tool stack.', 'https://clickup.com', ARRAY['SaaS']::sector_type[], 'San Diego', 'CA', 'United States', '$100M+', '501-1000', 87, NOW() - INTERVAL '79 days'),
(gen_random_uuid(), 'Coda', 'All-in-one doc that combines documents, spreadsheets, and apps.', 'Documents with superpowers - add buttons, tables, and automations.', 'https://coda.io', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'United States', '$50M-$100M', '201-500', 85, NOW() - INTERVAL '80 days'),

-- Consumer Startups
(gen_random_uuid(), 'Discord', 'Community platform for gamers and interest-based groups.', 'Chat rooms for communities - originally for gamers but now for everyone.', 'https://discord.com', ARRAY['Consumer', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '501-1000', 94, NOW() - INTERVAL '81 days'),
(gen_random_uuid(), 'Bereal', 'Authentic photo-sharing app with random daily prompts.', 'Get a notification, take an unfiltered photo of what youre doing right now.', 'https://bereal.com', ARRAY['Consumer']::sector_type[], 'Paris', NULL, 'France', '$10M-$50M', '51-100', 78, NOW() - INTERVAL '82 days'),
(gen_random_uuid(), 'Duolingo', 'Gamified language learning app with bite-sized lessons.', 'Learn languages for free with fun game-like lessons and a pushy owl.', 'https://duolingo.com', ARRAY['Consumer', 'AI/ML']::sector_type[], 'Pittsburgh', 'PA', 'United States', '$100M+', '501-1000', 92, NOW() - INTERVAL '83 days'),
(gen_random_uuid(), 'Headspace', 'Meditation and mental wellness app with guided sessions.', 'Calm down and sleep better with guided meditation for beginners.', 'https://headspace.com', ARRAY['Consumer', 'Healthcare']::sector_type[], 'Santa Monica', 'CA', 'United States', '$50M-$100M', '201-500', 83, NOW() - INTERVAL '84 days'),
(gen_random_uuid(), 'Calm', 'Sleep and meditation app for stress reduction.', 'Fall asleep to bedtime stories and reduce anxiety with meditation.', 'https://calm.com', ARRAY['Consumer', 'Healthcare']::sector_type[], 'San Francisco', 'CA', 'United States', '$100M+', '201-500', 85, NOW() - INTERVAL '85 days');

-- Add funding rounds for the new startups
INSERT INTO funding_rounds (id, startup_id, amount, round_type, date, lead_investors)
SELECT 
  gen_random_uuid(),
  s.id,
  CASE 
    WHEN s.estimated_revenue = '$100M+' THEN (random() * 300000000 + 100000000)::bigint
    WHEN s.estimated_revenue = '$50M-$100M' THEN (random() * 50000000 + 30000000)::bigint
    WHEN s.estimated_revenue = '$10M-$50M' THEN (random() * 20000000 + 10000000)::bigint
    ELSE (random() * 10000000 + 2000000)::bigint
  END,
  CASE 
    WHEN s.estimated_size IN ('1001-5000', '5001+') THEN 'Series C'::round_type
    WHEN s.estimated_size IN ('501-1000') THEN 'Series B'::round_type
    WHEN s.estimated_size IN ('201-500') THEN 'Series A'::round_type
    WHEN s.estimated_size IN ('101-200') THEN 'Seed'::round_type
    ELSE 'Pre-Seed'::round_type
  END,
  (s.created_at - INTERVAL '30 days')::date,
  ARRAY[
    CASE (random() * 10)::int
      WHEN 0 THEN 'Sequoia Capital'
      WHEN 1 THEN 'Andreessen Horowitz'
      WHEN 2 THEN 'Accel'
      WHEN 3 THEN 'Index Ventures'
      WHEN 4 THEN 'Lightspeed Venture Partners'
      WHEN 5 THEN 'General Catalyst'
      WHEN 6 THEN 'Greylock Partners'
      WHEN 7 THEN 'Benchmark'
      WHEN 8 THEN 'Tiger Global'
      ELSE 'Founders Fund'
    END
  ]
FROM startups s
WHERE s.created_at > NOW() - INTERVAL '90 days'
AND NOT EXISTS (SELECT 1 FROM funding_rounds fr WHERE fr.startup_id = s.id);

-- Add data sources for new startups
INSERT INTO data_sources (id, startup_id, name, confidence, url)
SELECT 
  gen_random_uuid(),
  s.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'TechCrunch'
    WHEN 1 THEN 'Crunchbase'
    WHEN 2 THEN 'SEC Filing'
    WHEN 3 THEN 'Company Press Release'
    ELSE 'LinkedIn'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'verified'::confidence_level
    WHEN 1 THEN 'high'::confidence_level
    ELSE 'medium'::confidence_level
  END,
  s.website
FROM startups s
WHERE s.created_at > NOW() - INTERVAL '90 days'
AND NOT EXISTS (SELECT 1 FROM data_sources ds WHERE ds.startup_id = s.id);