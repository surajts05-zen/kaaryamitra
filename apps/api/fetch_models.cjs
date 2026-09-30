const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst({ where: { geminiApiKey: { not: null } } }).then(async (t) => {
    if (t) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${t.geminiApiKey}`);
        const d = await r.json();
        console.log(d.models ? d.models.map(m => m.name) : d);
    } else {
        console.log('No tenant with key');
    }
    process.exit();
}).catch(console.error);
