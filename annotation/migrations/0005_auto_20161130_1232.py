# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-11-30 12:32
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('annotation', '0004_remove_annotationsimilarity_similarity_measure'),
    ]

    operations = [
        migrations.RenameField(
            model_name='annotation',
            old_name='name',
            new_name='value',
        ),
    ]