export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dealer_profiles: {
        Row: {
          business_name: string
          district: string
          ghana_card_number: string
          id_back_url: string | null
          id_front_url: string | null
          phone: string
          region: string
          rejection_reason: string | null
          reviewed_at: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["dealer_status"]
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          district: string
          ghana_card_number: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone: string
          region: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          district?: string
          ghana_card_number?: string
          id_back_url?: string | null
          id_front_url?: string | null
          phone?: string
          region?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["dealer_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          dealer_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_stats: {
        Row: {
          chat_clicks: number
          listing_id: string
          phone_clicks: number
          updated_at: string
          views: number
        }
        Insert: {
          chat_clicks?: number
          listing_id: string
          phone_clicks?: number
          updated_at?: string
          views?: number
        }
        Update: {
          chat_clicks?: number
          listing_id?: string
          phone_clicks?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_stats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          body_type: string | null
          category: Database["public"]["Enums"]["listing_category"]
          closed_reason: string | null
          colour: string | null
          condition: string | null
          contact: string | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          district: string | null
          engine: string | null
          fuel: string | null
          id: string
          make: string | null
          mileage: number | null
          model: string | null
          negotiable: boolean
          price: number
          region: string | null
          registration_status: string | null
          registration_year: number | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          transmission: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          category: Database["public"]["Enums"]["listing_category"]
          closed_reason?: string | null
          colour?: string | null
          condition?: string | null
          contact?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          engine?: string | null
          fuel?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          negotiable?: boolean
          price: number
          region?: string | null
          registration_status?: string | null
          registration_year?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          transmission?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          closed_reason?: string | null
          colour?: string | null
          condition?: string | null
          contact?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          engine?: string | null
          fuel?: string | null
          id?: string
          make?: string | null
          mileage?: number | null
          model?: string | null
          negotiable?: boolean
          price?: number
          region?: string | null
          registration_status?: string | null
          registration_year?: number | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          transmission?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          listing_id: string | null
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_listing_stat: {
        Args: { _field: string; _listing_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_my_threads: {
        Args: never
        Returns: {
          last_at: string
          last_message: string
          listing_id: string
          other_id: string
          unread_count: number
        }[]
      }
    }
    Enums: {
      app_role: "buyer" | "dealer_pending" | "dealer_verified" | "admin"
      dealer_status: "pending" | "approved" | "rejected"
      listing_category:
        | "car"
        | "motorcycle"
        | "bus"
        | "truck"
        | "heavy_equipment"
        | "parts"
        | "accessories"
        | "services"
      listing_status: "pending" | "approved" | "rejected" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["buyer", "dealer_pending", "dealer_verified", "admin"],
      dealer_status: ["pending", "approved", "rejected"],
      listing_category: [
        "car",
        "motorcycle",
        "bus",
        "truck",
        "heavy_equipment",
        "parts",
        "accessories",
        "services",
      ],
      listing_status: ["pending", "approved", "rejected", "closed"],
    },
  },
} as const
