# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2017-02-06 17:34
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('annotation', '0009_exercise_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataset',
            name='users',
            field=models.ManyToManyField(related_name='datasets', to=settings.AUTH_USER_MODEL),
        ),
    ]
