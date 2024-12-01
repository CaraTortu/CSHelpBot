export const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getUTCMonth() + 1}/${date.getFullYear()}`;
}

export const stringToDate = (date: string) => {
    const parts = date.split("/");

    if (parts.length !== 3) {
        return new Date(date);
    }

    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}
