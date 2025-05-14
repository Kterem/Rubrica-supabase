document.addEventListener('DOMContentLoaded', () => {
    // CONFIGURA QUI LE TUE CREDENZIALI SUPABASE!
    const SUPABASE_URL = 'IL_TUO_URL_SUPABASE'; // Sostituisci con il tuo URL Supabase
    const SUPABASE_ANON_KEY = 'LA_TUA_CHIAVE_ANON_SUPABASE'; // Sostituisci con la tua chiave anon Supabase

    if (SUPABASE_URL === 'IL_TUO_URL_SUPABASE' || SUPABASE_ANON_KEY === 'LA_TUA_CHIAVE_ANON_SUPABASE') {
        alert('ERRORE: Configura le tue credenziali Supabase in script.js!');
        // Disabilita il form e altre interazioni se non configurato
        document.getElementById('contactForm').style.pointerEvents = 'none';
        document.getElementById('contactForm').style.opacity = '0.5';
        document.getElementById('searchInput').disabled = true;
        return;
    }

    const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const contactForm = document.getElementById('contactForm');
    const contactIdInput = document.getElementById('contactId');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const addressInput = document.getElementById('address');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const formTitle = document.getElementById('form-title');
    const contactList = document.getElementById('contactList');
    const searchInput = document.getElementById('searchInput');
    const loadingMessage = document.getElementById('loadingMessage');
    const noContactsMessage = document.getElementById('noContactsMessage');

    let currentContacts = []; // Cache locale dei contatti per la ricerca

    // Mostra/Nascondi messaggi di stato
    const showLoading = (isLoading) => {
        loadingMessage.style.display = isLoading ? 'block' : 'none';
    };

    const showNoContacts = (shouldShow) => {
        noContactsMessage.style.display = shouldShow ? 'block' : 'none';
    };

    // Funzione per visualizzare i contatti
    function renderContacts(contactsToRender) {
        contactList.innerHTML = '';
        showNoContacts(contactsToRender.length === 0);

        if (contactsToRender.length === 0) return;

        contactsToRender.forEach(contact => {
            const li = document.createElement('li');
            li.dataset.id = contact.id;
            li.innerHTML = `
                <div class="contact-details">
                    <strong>${contact.name}</strong><br>
                    ${contact.phone ? `<small>Telefono: ${contact.phone}</small><br>` : ''}
                    ${contact.email ? `<small>Email: ${contact.email}</small><br>` : ''}
                    ${contact.address ? `<small>Indirizzo: ${contact.address}</small>` : ''}
                </div>
                <div class="actions">
                    <button class="btn btn-warning edit-btn">Modifica</button>
                    <button class="btn btn-danger delete-btn">Elimina</button>
                </div>
            `;
            contactList.appendChild(li);
        });
    }

    // Funzione per caricare i contatti da Supabase
    async function fetchContacts() {
        showLoading(true);
        contactList.innerHTML = ''; // Pulisci la lista prima di caricare
        showNoContacts(false);

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('name', { ascending: true }); // Ordina per nome

        showLoading(false);
        if (error) {
            console.error('Errore nel caricamento contatti:', error);
            alert('Impossibile caricare i contatti: ' + error.message);
            showNoContacts(true);
            currentContacts = [];
        } else {
            currentContacts = data;
            renderContacts(currentContacts);
        }
    }

    // Gestione invio form (Aggiunta/Modifica)
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = contactIdInput.value;
        const contactData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim() || null, // Invia null se vuoto
            email: emailInput.value.trim() || null,
            address: addressInput.value.trim() || null
        };

        if (!contactData.name) {
            alert('Il nome è obbligatorio.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = id ? 'Aggiornamento...' : 'Salvataggio...';

        let error;
        if (id) {
            // Modifica contatto esistente
            const { error: updateError } = await supabase
                .from('contacts')
                .update(contactData)
                .eq('id', id);
            error = updateError;
        } else {
            // Aggiungi nuovo contatto
            const { error: insertError } = await supabase
                .from('contacts')
                .insert([contactData]);
            error = insertError;
        }

        saveBtn.disabled = false;
        saveBtn.textContent = 'Salva';


        if (error) {
            console.error('Errore salvataggio contatto:', error);
            alert('Errore nel salvataggio del contatto: ' + error.message);
        } else {
            fetchContacts(); // Ricarica tutti i contatti
            resetForm();
        }
    });

    function resetForm() {
        contactForm.reset();
        contactIdInput.value = '';
        formTitle.textContent = 'Aggiungi';
        saveBtn.textContent = 'Salva';
        clearBtn.style.display = 'none';
        nameInput.focus();
    }

    // Bottone Annulla Modifica
    clearBtn.addEventListener('click', resetForm);

    // Gestione click su lista contatti (Modifica/Elimina)
    contactList.addEventListener('click', async (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;

        const id = li.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const contactToEdit = currentContacts.find(c => c.id === id);
            if (contactToEdit) {
                contactIdInput.value = contactToEdit.id;
                nameInput.value = contactToEdit.name;
                phoneInput.value = contactToEdit.phone || '';
                emailInput.value = contactToEdit.email || '';
                addressInput.value = contactToEdit.address || '';

                formTitle.textContent = 'Modifica';
                saveBtn.textContent = 'Aggiorna';
                clearBtn.style.display = 'inline-block';
                nameInput.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm(`Sei sicuro di voler eliminare questo contatto?`)) {
                target.disabled = true; // Disabilita il bottone durante l'eliminazione
                target.textContent = 'Eliminazione...';

                const { error } = await supabase
                    .from('contacts')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Errore eliminazione contatto:', error);
                    alert('Errore nell\'eliminazione del contatto: ' + error.message);
                    target.disabled = false;
                    target.textContent = 'Elimina';
                } else {
                    fetchContacts(); // Ricarica i contatti
                    if (contactIdInput.value === id) { // Se stavo modificando il contatto eliminato
                        resetForm();
                    }
                }
            }
        }
    });

    // Funzionalità di ricerca (client-side sulla cache `currentContacts`)
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderContacts(currentContacts); // Mostra tutti se la ricerca è vuota
            return;
        }
        const filteredContacts = currentContacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            (contact.phone && contact.phone.toLowerCase().includes(searchTerm)) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm))
        );
        renderContacts(filteredContacts);
    });

    // Caricamento iniziale dei contatti
    fetchContacts();
});
