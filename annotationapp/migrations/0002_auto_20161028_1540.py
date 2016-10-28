# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-28 15:40
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('annotationapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tier',
            name='entire_sound',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='annotation',
            name='end_time',
            field=models.IntegerField(blank=True, null=True, verbose_name='end_time'),
        ),
        migrations.AlterField(
            model_name='annotation',
            name='start_time',
            field=models.IntegerField(verbose_name='start_time'),
        ),
        migrations.AlterField(
            model_name='annotationsimilarity',
            name='similarity_measure',
            field=models.IntegerField(verbose_name='similarity_measure'),
        ),
    ]
