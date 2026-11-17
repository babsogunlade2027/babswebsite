document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("volunteer-form");
    const messageDiv = document.getElementById("form-message");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = {
                fullname: document.getElementById("fullname").value.trim(),
                phone: document.getElementById("phone").value.trim(),
                ward: document.getElementById("ward").value.trim(),
                created_at: new Date().toISOString()
            };

            messageDiv.style.color = "#0b4f6c";
            messageDiv.textContent = "Submitting your details...";

            try {
                // Check if Supabase client is active
                if (supabaseClient) {
                    const { error } = await supabaseClient
                        .from('volunteers')
                        .insert([formData]);

                    if (error) throw error;
                } else {
                    // Fallback simulation for local/static testing
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                messageDiv.style.color = "#2e7d32";
                messageDiv.textContent = "Thank you! Your registration was successful.";
                form.reset();
            } catch (err) {
                console.error("Submission error:", err);
                messageDiv.style.color = "#c62828";
                messageDiv.textContent = "Submission failed. Please check your connection and try again.";
            }
        });
    }
});
