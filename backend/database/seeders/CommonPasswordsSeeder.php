<?php

namespace Database\Seeders;

use App\Models\CommonPassword;
use Illuminate\Database\Seeder;

class CommonPasswordsSeeder extends Seeder
{
    public function run()
    {
        $passwords = [
            'password', '123456', '12345678', 'qwerty', 'abc123',
            'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
            'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
            'bailey', 'passw0rd', 'shadow', '123123', '654321',
            'superman', 'qazwsx', 'michael', 'football', 'password1',
            'password123', 'welcome', 'welcome1', 'admin', 'login',
            'passw0rd123', 'hello', 'charlie', 'donald', 'princess',
            'solo', 'starwars', 'peanuts', 'jennifer', 'jordan',
            'harley', 'ranger', 'hunter', 'robert', 'london',
            'fuckoff', 'summer', 'tigger', 'galaxy', 'matrix',
            'maggie', 'a12345', 'lovely', 'amanda', 'purple',
            'daniel', '1234567890', 'secret', 'test', 'buster',
            'soccer', 'hammer', 'pepper', 'banana', 'george',
            'yellow', 'zaq12wsx', 'asdfgh', 'cheese', 'taylor',
            'whatever', 'dolphin', 'junior', 'patrick', 'chicken',
            'joshua', 'matthew', 'andrew', 'ginger', 'emily',
            'arsenal', 'liverpool', 'manchester', 'chelsea',
            'boston', 'seattle', 'miami', 'phoenix', 'denver',
            'prince', 'cookie', 'friends', 'master1', 'test1234',
            '123qwe', 'zxcvbnm', 'asdfghjkl', 'qazwsxedc',
            'hunter1', 'master2', 'admin123', 'root', 'toor',
            'pass123', 'pass1234', 'qwerty123', 'qwertyuiop',
            '1q2w3e4r', '1q2w3e', 'q1w2e3r4', 'zxc123',
            '123zxc', '123asd', 'asd123', 'zxcvbn',
            'iloveyou1', 'iloveyou2', 'love123', 'love1234',
            'password2', 'password12', 'password!',
            '12345678910', '987654321', '0123456789',
            'password!', 'P@ssword', 'P@ssw0rd', 'P@ssword1',
            'Changeme', 'Welcome1', 'Welcome123', 'Winter2024',
            'Spring2024', 'Summer2024', 'Autumn2024',
        ];

        foreach ($passwords as $pwd) {
            CommonPassword::updateOrCreate(
                ['password' => $pwd],
                ['password' => $pwd]
            );
        }
    }
}