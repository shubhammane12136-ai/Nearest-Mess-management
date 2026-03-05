import { supabase } from './supabase.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.initialized = false;
    }

    /**
     * Initialize Auth state. 
     * Call this at the start of every page to get the current user and their role.
     */
    async init() {
        if (this.initialized) return this.currentUser;

        // 1. Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session) {
            this.currentUser = session.user;
            // Fetch role from profiles table
            this.userRole = await this.getRole(session.user.id);
        }

        this.initialized = true;

        // 2. Listen for Auth Changes (Login/Logout)
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                this.currentUser = session.user;
                this.userRole = await this.getRole(session.user.id);
            } else {
                this.currentUser = null;
                this.userRole = null;
            }
            // Trigger a custom event if you want other parts of the app to react
            document.dispatchEvent(new CustomEvent('authChange', { detail: { user: this.currentUser, role: this.userRole } }));
        });

        return this.currentUser;
    }

    /**
     * User Registration
     * 1. Signs up with email/password
     * 2. Inserts user metadata into the 'profiles' table
     */
    async register(email, password, role, name = "New User") {
        try {
            // 1. Supabase Sign Up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            });

            if (error) throw error;

            // 2. We need the user object. If email confirmation is ON, data.user might exist but data.session will be null.
            // For this project, we assume email confirmation is OFF in Supabase settings.
            const user = data.user;
            if (!user) throw new Error("Signup failed - check your connection.");

            // 3. Create the profile row (THIS IS WHERE ROLE IS SAVED)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        email: user.email,
                        role: role, // 'student' or 'owner'
                        name: name
                    }
                ]);

            if (profileError) {
                console.error("Profile creation failed:", profileError.message);
                // Even if profile fails, user is technically registered in Auth. 
                // We show an alert so the user knows something is wrong.
                alert("Auth worked, but profile failed: " + profileError.message);
            }

            return { user, error: profileError };
        } catch (error) {
            console.error("Registration Error:", error.message);
            throw error;
        }
    }

    /**
     * User Login
     * 1. Signs in with email/password
     * 2. Fetches their specific role for redirection
     */
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            const user = data.user;
            const role = await this.getRole(user.id);

            this.currentUser = user;
            this.userRole = role;

            return { user, role };
        } catch (error) {
            console.error("Login Error:", error.message);
            throw error;
        }
    }

    /**
     * Helper: Fetch role from the 'profiles' table using UUID
     */
    async getRole(uid) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', uid)
                .single(); // Gets a single row object

            if (error) {
                console.warn("Could not find user role in profiles table:", error.message);
                return null;
            }
            return data.role;
        } catch (err) {
            return null;
        }
    }

    /**
     * Logout
     */
    async logout() {
        await supabase.auth.signOut();
        this.currentUser = null;
        this.userRole = null;
        window.location.href = 'index.html';
    }

    /**
     * Page Guard: Redirects to index if not an owner
     */
    async requireOwner() {
        const user = await this.init();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }

        if (this.userRole !== 'owner') {
            alert("Access Denied: Owner account required.");
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

export const authService = new AuthService();
