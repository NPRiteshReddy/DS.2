const { supabase } = require('./src/config/database');

async function listScripts() {
    try {
        const { data: scripts, error } = await supabase
            .from('video_scripts')
            .select('id, title, created_at, status')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        console.log('\n=== Recent Video Scripts ===');
        scripts.forEach(s => {
            console.log(`[${s.id}] ${s.title} (${s.status}) - ${new Date(s.created_at).toLocaleString()}`);
        });
        console.log('============================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error listing scripts:', error.message);
        process.exit(1);
    }
}

listScripts();
