import { supabase } from './supabase.js';

class MessService {
    constructor() {
        // DY Patil College, Kasba Bawda Coordinates
        this.DYP_COORDS = { lat: 16.7050, lng: 74.2433 };
    }

    // --- Public Discovery ---

    // Fetch messes from Supabase based on user search and filters
    async getAllMesses(filters = {}) {
        let query = supabase.from('messes').select('*');

        // Apply filters directly to the Postgres query (Case-Insensitive)
        if (filters.name) query = query.ilike('name', `%${filters.name}%`);
        if (filters.type && filters.type !== 'all') query = query.eq('veg_type', filters.type);
        if (filters.gender && filters.gender !== 'all') query = query.eq('category', filters.gender);

        const { data, error } = await query;
        if (error) throw error;

        // Enrich the data with distance calculations relative to DY Patil College
        return data.map(mess => ({
            ...mess,
            distance: this.calculateDistance(
                this.DYP_COORDS.lat, this.DYP_COORDS.lng,
                mess.latitude || this.DYP_COORDS.lat, mess.longitude || this.DYP_COORDS.lng
            )
        })).sort((a, b) => a.distance - b.distance);
    }

    // Rating System Logic (Atomic Updates in Supabase)
    async rateMess(messId, userRating) {
        const { data: mess } = await supabase
            .from('messes')
            .select('rating, total_ratings')
            .eq('id', messId)
            .single();

        const total = (mess.total_ratings || 0) + 1;
        const newAverage = ((mess.rating * mess.total_ratings) + userRating) / total;

        const { error } = await supabase
            .from('messes')
            .update({
                rating: parseFloat(newAverage.toFixed(1)),
                total_ratings: total
            })
            .eq('id', messId);

        if (error) throw error;
    }

    // --- Private Management (Owner Only) ---

    // Get messes for a specific owner 
    async getOwnerMesses(ownerUid) {
        const { data, error } = await supabase
            .from('messes')
            .select('*')
            .eq('owner_id', ownerUid);

        if (error) throw error;
        return data || [];
    }

    // Comprehensive saving logic (New vs Edit)
    async saveMess(messData, imageFile = null) {
        let image_url = messData.image_url;

        // 1. Handle Cover Photo Upload
        if (imageFile) {
            const fileName = `${messData.owner_id}/${Date.now()}_${imageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('mess-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: publicUrl } = supabase.storage
                .from('mess-images')
                .getPublicUrl(fileName);

            image_url = publicUrl.publicUrl;
        }

        // 2. Prepare Final Payload
        const id = messData.id || null;
        const { ...payload } = { ...messData, image_url };
        delete payload.id; // Don't send id in the body, use it in the query

        if (id) {
            // Update Existing Mess (Requires matching owner_id)
            const { error } = await supabase
                .from('messes')
                .update(payload)
                .eq('id', id)
                .eq('owner_id', messData.owner_id);
            if (error) throw error;
        } else {
            // Insert New Mess to Supabase
            const { error } = await supabase
                .from('messes')
                .insert([payload]);
            if (error) throw error;
        }
    }

    // Delete mess listing from Cloud
    async deleteMess(messId, ownerId) {
        const { error } = await supabase
            .from('messes')
            .delete()
            .eq('id', messId)
            .eq('owner_id', ownerId);

        if (error) throw error;
    }

    // --- Menu Management ---

    async getWeeklyMenu(messId) {
        const { data, error } = await supabase
            .from('mess_menu')
            .select('*')
            .eq('mess_id', messId);
        if (error) throw error;
        return data;
    }

    async saveMenuDay(menuData) {
        const { error } = await supabase
            .from('mess_menu')
            .upsert([menuData], { onConflict: 'mess_id,day' });
        if (error) throw error;
    }

    async deleteMenuDay(id) {
        const { error } = await supabase
            .from('mess_menu')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // --- Student Actions ---

    async joinMess(messId) {
        // 1. Check current seats
        const { data: mess, error: fetchError } = await supabase
            .from('messes')
            .select('available_seats')
            .eq('id', messId)
            .single();

        if (fetchError) throw fetchError;
        if (mess.available_seats <= 0) throw new Error("This mess is currently full!");

        // 2. Decrement seats
        const { error: updateError } = await supabase
            .from('messes')
            .update({ available_seats: mess.available_seats - 1 })
            .eq('id', messId);

        if (updateError) throw updateError;
        return true;
    }

    // --- Distance Math Helper ---

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    }
}

export const messService = new MessService();
