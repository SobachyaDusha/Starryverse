document.addEventListener('DOMContentLoaded',async()=>{
 const b=await window.archiveBackendReady,$=s=>document.querySelector(s); const msg=$('#adminMessage');
 const paint=()=>{const logged=!!b?.session;$('#loggedOut').classList.toggle('hidden',logged);$('#loggedIn').classList.toggle('hidden',!logged);if(logged){$('#adminIdentity').textContent=b.isAdmin?`${b.session.user.email} · администратор`:`${b.session.user.email} · нет прав администратора`;msg.textContent=b.isAdmin?'Можно редактировать сайт. Изменения публикуются сразу.':'Вход выполнен, но этот email не входит в список администраторов.';}};
 $('#adminLogin').onclick=async()=>{try{msg.textContent='Входим…';await b.signIn($('#adminEmail').value.trim(),$('#adminPassword').value);paint()}catch(e){msg.textContent=e.message}};
 $('#adminSignup').onclick=async()=>{try{msg.textContent='Создаём аккаунт…';const d=await b.signUp($('#adminEmail').value.trim(),$('#adminPassword').value);paint();if(!d.session)msg.textContent='Аккаунт создан. Проверь почту и подтверди email, затем войди.'}catch(e){msg.textContent=e.message}};
 $('#adminLogout').onclick=async()=>{await b.signOut();paint()}; paint();
});