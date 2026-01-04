const { createClient } = require('@supabase/supabase-js');

// Using env vars if available or placeholder. 
// Since I don't see env vars in the prompt context easily, I'll rely on what's in 'supabase.ts' or 'constants.ts' if I can read them.
// But wait, I can just read 'd:\DOCUMENTOS\PROJETO PETSHOP\supabase.ts' first to get the URL/Key?
// Or I can try to import them if I use module syntax, but node basic doesn't support import with
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fxganlqikiqaljykfxub.supabase.co';
const supabaseAnonKey = 'sb_publishable_4-Qv1o0ojs8d7_cVQQNgsQ_pZhJtsiM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

listProducts();
