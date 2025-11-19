// ============================================
// lib/trpc/routers/admin-users.ts
// ============================================
import { z } from 'zod'
import { router, adminProcedure } from '../server'
import { createUserSchema } from '../../validations/auth'
import { Profile } from '../../../types'

export const adminUsersRouter = router({
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        role: z.enum(['admin', 'user', 'all']).default('all'),
        getAll: z.boolean().default(false), // New parameter to get all users at once
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      let query = ctx.supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      if (input.search) {
        query = query.or(`email.ilike.%${input.search}%,full_name.ilike.%${input.search}%`)
      }

      if (input.role !== 'all') {
        query = query.eq('role', input.role)
      }

      if (input.getAll) {
        // Fetch all users without pagination
        const { data, count } = await query.order('created_at', { ascending: false })
        
        return {
          users: data || [],
          total: count || 0,
          pages: 1, // Single page when getting all
        }
      } else {
        // Paginated fetching
        const { data, count } = await query
          .order('created_at', { ascending: false })
          .range((input.page - 1) * input.limit, input.page * input.limit - 1)

        return {
          users: data || [],
          total: count || 0,
          pages: Math.ceil((count || 0) / input.limit),
        }
      }
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['admin', 'user']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      const { data, error } = await ctx.supabase
        .from('profiles')
        .update({ role: input.role })
        .eq('id', input.userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: `Admin updated user role to ${input.role}`,
        metadata: { target_user_id: input.userId },
      })

      return data
    }),

  // Consolidated update user mutation - handles both profile and role updates
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
        middleName: z.string().max(50, 'Middle name too long').optional().or(z.literal('')),
        lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
        email: z.string().email('Invalid email address'),
        mobileNo: z.string()
          .regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4}$/, 'Invalid mobile number format')
          .optional()
          .or(z.literal('')),
        dateOfBirth: z.string()
          .refine((val) => {
            if (!val) return true // optional field
            const date = new Date(val)
            const now = new Date()
            const age = now.getFullYear() - date.getFullYear()
            return date <= now && age >= 13 && age <= 120
          }, { message: 'Please enter a valid date of birth (13-120 years old)' })
          .optional()
          .or(z.literal('')),
        role: z.enum(['admin', 'user']),
        sex: z.enum(['Male', 'Female']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      // Check if email is already taken by another user
      const { data: existingProfile } = await ctx.supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .neq('id', input.userId)
        .single()

      if (existingProfile) {
        throw new Error(`A user with email ${input.email} already exists`)
      }

      // Construct full_name from name components
      const constructFullName = (firstName: string, middleName?: string, lastName?: string): string => {
        const parts = [firstName]
        
        // Add middle name only if it's not empty
        if (middleName && middleName.trim()) {
          parts.push(middleName.trim())
        }
        
        // Add last name only if it's not empty
        if (lastName && lastName.trim()) {
          parts.push(lastName.trim())
        }
        
        return parts.filter(Boolean).join(' ')
      }

      const fullName = constructFullName(input.firstName, input.middleName, input.lastName)

      const updateData: Partial<Pick<Profile, 'first_name' | 'middle_name' | 'last_name' | 'email' | 'mobile_no' | 'date_of_birth' | 'sex' | 'role' | 'full_name' | 'updated_at'>> = {
        first_name: input.firstName,
        middle_name: input.middleName || undefined,
        last_name: input.lastName,
        email: input.email,
        mobile_no: input.mobileNo || undefined,
        date_of_birth: input.dateOfBirth || undefined,
        sex: input.sex,
        role: input.role,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await ctx.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', input.userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin updated user',
        metadata: { target_user_id: input.userId },
      })

      return data
    }),

  // Keep the old individual mutations for backward compatibility
  updateUserProfile: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        firstName: z.string().optional(),
        middleName: z.string().optional(),
        lastName: z.string().optional(),
        mobileNo: z.string().optional(),
        dateOfBirth: z.string().optional(),
        sex: z.enum(['Male', 'Female']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      const updateData: Partial<Pick<Profile, 'first_name' | 'middle_name' | 'last_name' | 'mobile_no' | 'date_of_birth' | 'sex' | 'updated_at'>> = {}
      if (input.firstName !== undefined) updateData.first_name = input.firstName
      if (input.middleName !== undefined) updateData.middle_name = input.middleName
      if (input.lastName !== undefined) updateData.last_name = input.lastName
      if (input.mobileNo !== undefined) updateData.mobile_no = input.mobileNo
      if (input.dateOfBirth !== undefined) updateData.date_of_birth = input.dateOfBirth
      if (input.sex !== undefined) updateData.sex = input.sex
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await ctx.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', input.userId)
        .select()
        .single()

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin updated user profile',
        metadata: { target_user_id: input.userId },
      })

      return data
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      // Delete profile (cascade will handle related records)
      const { error } = await ctx.supabase
        .from('profiles')
        .delete()
        .eq('id', input.userId)

      if (error) throw new Error(error.message)

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin deleted user',
        metadata: { deleted_user_id: input.userId },
      })

      return { success: true }
    }),

  createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      // Check if user already exists
      const { data: existingProfile } = await ctx.supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .single()

      if (existingProfile) {
        throw new Error(`A user with email ${input.email} already exists`)
      }

      // Create auth user
      const { data: authData, error: authError } = await ctx.supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      // Construct full_name from name components
      const constructFullName = (firstName: string, middleName?: string, lastName?: string): string => {
        const parts = [firstName]
        
        // Add middle name only if it's not empty
        if (middleName && middleName.trim()) {
          parts.push(middleName.trim())
        }
        
        // Add last name only if it's not empty
        if (lastName && lastName.trim()) {
          parts.push(lastName.trim())
        }
        
        return parts.filter(Boolean).join(' ')
      }

      const fullName = constructFullName(input.firstName, input.middleName, input.lastName)

      // Create the profile
      const { data: profileData, error: profileError } = await ctx.supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          user_id: authData.user!.id,
          email: input.email,
          first_name: input.firstName,
          middle_name: input.middleName,
          last_name: input.lastName,
          full_name: fullName, // Include constructed full_name
          mobile_no: input.mobileNo,
          date_of_birth: input.dateOfBirth,
          sex: input.sex,
          role: input.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        // Rollback: delete the auth user if profile creation fails
        await ctx.supabase.auth.admin.deleteUser(authData.user!.id)
        throw new Error(`Profile creation error: ${profileError.message}`)
      }

      await ctx.supabase.from('activities').insert({
        user_id: ctx.user.id,
        activity_type: 'data_edit',
        description: 'Admin created new user',
        metadata: { new_user_id: authData.user!.id },
      })

      return profileData
    }),

  checkEmailAvailability: adminProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.supabase) {
        throw new Error('Supabase client not available')
      }
      
      const { data, error } = await ctx.supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw new Error(`Database error: ${error.message}`)
      }

      return {
        available: !data,
        email: input.email
      }
    }),
})