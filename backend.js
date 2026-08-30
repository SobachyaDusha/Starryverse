window.archiveBackendReady=(async()=>{
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const client=createClient('https://mqwafaevosjflykbwnot.supabase.co','sb_publishable_1vASxPl_jXIzgQH2RLOPnA_WWWv4U-M');
  let session=null,isAdmin=false,lastLocalWrite=0;
  async function refreshAuth(){
    const {data}=await client.auth.getSession();
    session=data.session||null;
    if(session){
      const {data:ok}=await client.rpc('is_site_admin');
      isAdmin=!!ok;
    }else isAdmin=false;
    return {session,isAdmin};
  }
  await refreshAuth();
  const api={
    client,
    get session(){return session},
    get isAdmin(){return isAdmin},
    async refreshAuth(){return refreshAuth()},
    async signIn(email,password){
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error) throw error; await refreshAuth(); return data;
    },
    async signUp(email,password){
      const {data,error}=await client.auth.signUp({email,password});
      if(error) throw error; await refreshAuth(); return data;
    },
    async signOut(){await client.auth.signOut(); await refreshAuth()},
    async loadState(){
      const {data,error}=await client.from('archive_state').select('data').eq('id','main').maybeSingle();
      if(error) throw error; return data?.data||{};
    },
    async saveState(state){
      if(!isAdmin) throw new Error('Только администратор может изменять архив.');
      lastLocalWrite=Date.now();
      const {error}=await client.from('archive_state').upsert({id:'main',data:state,updated_at:new Date().toISOString(),updated_by:session?.user?.id||null},{onConflict:'id'});
      if(error) throw error;
    },
    async uploadImage(id,blob){
      if(!isAdmin) throw new Error('Только администратор может загружать изображения.');
      const {error}=await client.storage.from('artworks').upload(id,blob,{upsert:true,contentType:blob.type||'application/octet-stream',cacheControl:'3600'});
      if(error) throw error;
      return client.storage.from('artworks').getPublicUrl(id).data.publicUrl;
    },
    imageUrl(id){return client.storage.from('artworks').getPublicUrl(id).data.publicUrl},
    async getImage(id){const r=await fetch(api.imageUrl(id)); return r.ok?await r.blob():null},
    async deleteImage(id){if(!isAdmin) throw new Error('Только администратор может удалять изображения.'); const {error}=await client.storage.from('artworks').remove([id]); if(error) throw error},
    subscribe(onChange){
      return client.channel('archive-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'archive_state',filter:'id=eq.main'},payload=>{
        if(Date.now()-lastLocalWrite<1200) return;
        onChange(payload.new?.data||{});
      }).subscribe();
    }
  };
  window.archiveBackend=api;
  return api;
})().catch(err=>{console.error('Supabase init failed',err);window.archiveBackend=null;return null});