            {/* Submit and Cancel Buttons */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-border/20">
              <CancelButton
                onClick={handleCancel}
                disabled={form.formState.isSubmitting || isSubmitting}
                size="lg"
                className="flex-1"
              >
                Cancel
              </CancelButton>
              <CreateUserButton
                onClick={handleFormSubmit}
                disabled={!form.formState.isValid || form.formState.isSubmitting || isSubmitting || isSuccess}
                size="lg"
                className="flex-1"
                asyncState={isSubmitting ? 'loading' : isSuccess ? 'success' : submitError ? 'error' : 'idle'}
                errorText={submitError || "Failed to create user - Please try again"}
              >
                Create User
              </CreateUserButton>
            </div>