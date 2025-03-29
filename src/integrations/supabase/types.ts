export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_coach_content_filters: {
        Row: {
          created_at: string | null
          description: string | null
          filter_type: string
          id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filter_type: string
          id?: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filter_type?: string
          id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      ai_coach_conversations: {
        Row: {
          ai_response: string
          conversation_id: string | null
          created_at: string
          id: string
          image_url: string | null
          is_root: boolean
          pinned: boolean
          summary: string | null
          title: string | null
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_root?: boolean
          pinned?: boolean
          summary?: string | null
          title?: string | null
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_root?: boolean
          pinned?: boolean
          summary?: string | null
          title?: string | null
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_coach_welcome_content: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          icon_color: string | null
          id: string
          position: number | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          position?: number | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          icon_color?: string | null
          id?: string
          position?: number | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_coach_welcome_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ai_coach_welcome_content"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      compass_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compass_clarifications: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          question: string
          task_id: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          question: string
          task_id: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          question?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_clarifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "compass_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_plans: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compass_priority_rules: {
        Row: {
          created_at: string
          id: string
          keyword: string
          priority: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          priority: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          priority?: string
          updated_at?: string
        }
        Relationships: []
      }
      compass_reminders: {
        Row: {
          created_at: string
          id: string
          method: string
          task_id: string
          trigger_at: string
          triggered: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          task_id: string
          trigger_at: string
          triggered?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          task_id?: string
          trigger_at?: string
          triggered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "compass_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "compass_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compass_task_tags: {
        Row: {
          created_at: string
          id: string
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "compass_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compass_task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "compass_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          plan_id: string
          priority: string
          reasoning: string | null
          task_text: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          plan_id: string
          priority: string
          reasoning?: string | null
          task_text: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          plan_id?: string
          priority?: string
          reasoning?: string | null
          task_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compass_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "compass_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compass_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "compass_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      compass_user_profiles: {
        Row: {
          business_name: string | null
          created_at: string
          crew_size: string | null
          id: string
          specialties: string[] | null
          updated_at: string
          view_preferences: Json | null
          workload: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          crew_size?: string | null
          id: string
          specialties?: string[] | null
          updated_at?: string
          view_preferences?: Json | null
          workload?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          crew_size?: string | null
          id?: string
          specialties?: string[] | null
          updated_at?: string
          view_preferences?: Json | null
          workload?: string | null
        }
        Relationships: []
      }
      custom_prompts: {
        Row: {
          base_prompt_id: string | null
          created_at: string
          created_by: string
          id: string
          updated_at: string
        }
        Insert: {
          base_prompt_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
        }
        Update: {
          base_prompt_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_prompts_base_prompt_id_fkey"
            columns: ["base_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_statements: {
        Row: {
          end_date: string | null
          error_message: string | null
          filename: string
          id: string
          processed: boolean | null
          start_date: string | null
          statement_type: string
          upload_date: string
          user_id: string
        }
        Insert: {
          end_date?: string | null
          error_message?: string | null
          filename: string
          id?: string
          processed?: boolean | null
          start_date?: string | null
          statement_type: string
          upload_date?: string
          user_id: string
        }
        Update: {
          end_date?: string | null
          error_message?: string | null
          filename?: string
          id?: string
          processed?: boolean | null
          start_date?: string | null
          statement_type?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      graphlit_collections: {
        Row: {
          created_at: string
          description: string | null
          graphlit_collection_id: string | null
          id: string
          is_public: boolean
          is_system: boolean
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          graphlit_collection_id?: string | null
          id?: string
          is_public?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          graphlit_collection_id?: string | null
          id?: string
          is_public?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      graphlit_config: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      graphlit_content_items: {
        Row: {
          collection_id: string
          content_type: string | null
          created_at: string
          file_path: string | null
          graphlit_collection_id: string | null
          graphlit_content_id: string | null
          id: string
          is_public: boolean
          name: string | null
          owner_id: string | null
          source_url: string | null
          state: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          collection_id: string
          content_type?: string | null
          created_at?: string
          file_path?: string | null
          graphlit_collection_id?: string | null
          graphlit_content_id?: string | null
          id?: string
          is_public?: boolean
          name?: string | null
          owner_id?: string | null
          source_url?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          collection_id?: string
          content_type?: string | null
          created_at?: string
          file_path?: string | null
          graphlit_collection_id?: string | null
          graphlit_content_id?: string | null
          id?: string
          is_public?: boolean
          name?: string | null
          owner_id?: string | null
          source_url?: string | null
          state?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graphlit_content_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "graphlit_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      graphlit_content_tags: {
        Row: {
          content_item_id: string
          tag_id: string
        }
        Insert: {
          content_item_id: string
          tag_id: string
        }
        Update: {
          content_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graphlit_content_tags_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "graphlit_content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graphlit_content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "graphlit_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      graphlit_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      graphlit_user_collections: {
        Row: {
          collection_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graphlit_user_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "graphlit_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json
          created_at: string
          current_step: number
          id: string
          is_completed: boolean
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_required: boolean
          order_index: number
          step_key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_required?: boolean
          order_index: number
          step_key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_required?: boolean
          order_index?: number
          step_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      parameter_tweaks: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
          order: number | null
          parameter_id: string | null
          sub_prompt: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
          order?: number | null
          parameter_id?: string | null
          sub_prompt: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
          order?: number | null
          parameter_id?: string | null
          sub_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parameter_tweaks_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "prompt_parameters"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          conversation_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pg_activity_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pg_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_conversations: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string
          id: string
          pinned: boolean
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pg_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "pg_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pg_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bio: string | null
          business_address: string | null
          company_description: string | null
          company_name: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          business_address?: string | null
          company_description?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          business_address?: string | null
          company_description?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      prompt_additional_context: {
        Row: {
          context_text: string
          created_at: string
          custom_prompt_id: string
          id: string
        }
        Insert: {
          context_text: string
          created_at?: string
          custom_prompt_id: string
          id?: string
        }
        Update: {
          context_text?: string
          created_at?: string
          custom_prompt_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_additional_context_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: true
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_customizations: {
        Row: {
          created_at: string
          custom_prompt_id: string
          id: string
          parameter_tweak_id: string
        }
        Insert: {
          created_at?: string
          custom_prompt_id: string
          id?: string
          parameter_tweak_id: string
        }
        Update: {
          created_at?: string
          custom_prompt_id?: string
          id?: string
          parameter_tweak_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_customizations_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_customizations_parameter_tweak_id_fkey"
            columns: ["parameter_tweak_id"]
            isOneToOne: false
            referencedRelation: "parameter_tweaks"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_generations: {
        Row: {
          created_at: string
          created_by: string
          custom_prompt_id: string
          generated_content: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          custom_prompt_id: string
          generated_content: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          custom_prompt_id?: string
          generated_content?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_generations_custom_prompt_id_fkey"
            columns: ["custom_prompt_id"]
            isOneToOne: false
            referencedRelation: "custom_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_parameter_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          order: number | null
          parameter_id: string
          prompt_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order?: number | null
          parameter_id: string
          prompt_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          order?: number | null
          parameter_id?: string
          prompt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_parameter_rules_parameter_id_fkey"
            columns: ["parameter_id"]
            isOneToOne: false
            referencedRelation: "prompt_parameters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_parameter_rules_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_parameters: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["prompt_parameter_type"]
          updated_at?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          hub_area: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name: string | null
          id: string
          is_category: boolean
          is_default: boolean | null
          parent_id: string | null
          prompt: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          hub_area?: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name?: string | null
          id?: string
          is_category?: boolean
          is_default?: boolean | null
          parent_id?: string | null
          prompt?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          hub_area?: Database["public"]["Enums"]["hub_area_type"] | null
          icon_name?: string | null
          id?: string
          is_category?: boolean
          is_default?: boolean | null
          parent_id?: string | null
          prompt?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_generations: {
        Row: {
          content: string
          created_at: string
          id: string
          original_generation_id: string | null
          slug: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          original_generation_id?: string | null
          slug?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          original_generation_id?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_generations_original_generation_id_fkey"
            columns: ["original_generation_id"]
            isOneToOne: false
            referencedRelation: "prompt_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          job_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          transaction_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action_details: Json
          action_type: string
          affected_resource_id: string | null
          affected_resource_type: string | null
          affected_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json
          action_type: string
          affected_resource_id?: string | null
          affected_resource_type?: string | null
          affected_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          affected_resource_id?: string | null
          affected_resource_type?: string | null
          affected_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ai_setting: {
        Args: {
          setting_name: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_action_type: string
          p_action_details?: Json
          p_affected_user_id?: string
          p_affected_resource_type?: string
          p_affected_resource_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      hub_area_type:
        | "marketing"
        | "sales"
        | "operations"
        | "client_communications"
        | "general"
      prompt_parameter_type:
        | "tone_and_style"
        | "audience"
        | "length"
        | "focus"
        | "format"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
