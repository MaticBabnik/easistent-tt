
import slugify from "slugify";

export function slugifyTeacher(teacher: string) {
    return slugify(teacher, { 
        replacement: '-',
        remove: /[\.]/,
        strict:true,
        lower:true
    });
}