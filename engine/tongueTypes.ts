export interface HirataInput {
    tongue_color: string;
    coat_color: string;
    coat_thickness: string;
    moisture: string;
    tongue_form: string;
}

export interface HirataOutput {
    pattern: string; // JIKKAN, KYOKAN, JITSUNETSU, KYONETSU, or HOLD
    temp_score: number;
    defex_score: number;
    hold_reason: string | null;
    flags: string[];
}
